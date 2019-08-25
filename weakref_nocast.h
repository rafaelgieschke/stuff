#include <stdatomic.h>
#include <stdint.h>

#define length(array) (sizeof(array) / sizeof *(array))
#define index_ref(ptr) \
  ((uintptr_t)(ptr) % (sizeof(*(ptr))->_ptr / 2) / sizeof *(*(ptr))->_ptr)

struct ref {
  _Atomic long int count;
  struct ref *_ptr[32 * 2];
  void (*free)(struct ref *ref);
};

struct ref *get_ref(struct ref **_Atomic *weakref) {
  struct ref **old_ref = *weakref;
  for (; old_ref;) {
    if (!index_ref(old_ref + 1)) {
      old_ref = *weakref;
      continue;
    }
    if (atomic_compare_exchange_weak(weakref, &old_ref, old_ref + 1)) break;
  }
  if (++(*old_ref)->count == -1) *(volatile char *)0 = 0;
  for (struct ref **cur_ref = old_ref;;) {
    if (atomic_compare_exchange_weak(weakref, &cur_ref, cur_ref - 1)) break;
    if (old_ref - index_ref(old_ref) != cur_ref - index_ref(cur_ref)) {
      (*old_ref)->count--;
      break;
    }
  }
  return *old_ref;
}

void put_ref(struct ref *ref) {
  if (!--ref->count) ref->free(ref);
};

void init_ref(struct ref *ref) {
  for (size_t i = 0; i < length(ref->_ptr); i++) ref->_ptr[i] = ref;
  ref->count = 0;
}

void set_weakref(struct ref **_Atomic *weakref, struct ref *ref) {
  if (ref) ref->count += sizeof(ref->_ptr) + 1;
  struct ref **old_ref = atomic_exchange(
      weakref, &ref->_ptr[length(ref->_ptr) / 2 - index_ref(ref->_ptr)]);
  if (!old_ref) return;
  (*old_ref)->count += index_ref(old_ref) - sizeof(ref->_ptr);
  put_ref(*old_ref);
}
