#include <stdatomic.h>
#include <stdint.h>

#define aligned_ref(ptr) \
  ((union aligned_ref *)((ptr) - (uintptr_t)(ptr) % sizeof(union aligned_ref)))

union aligned_ref {
  struct ref *ref;
  void *_padding[(32 - 1) / sizeof(void *) + 1];
};

struct ref {
  _Atomic long int count;
  void (*free)(struct ref *ref);
  char _padding[sizeof(union aligned_ref)];
  char _aligned_ref[sizeof(union aligned_ref)];
};

struct ref *get_ref(void *_Atomic *weakref) {
  char *old_weakref = (char *)*weakref;
  do {
    if (!old_weakref) return 0;
    if (aligned_ref(old_weakref) != aligned_ref(old_weakref + 1)) {
      old_weakref = (char *)*weakref;
      continue;
    }
  } while (!atomic_compare_exchange_weak(weakref, (void **)&old_weakref,
                                         old_weakref + 1));
  struct ref *ref = aligned_ref(old_weakref)->ref;
  if (++ref->count == -1) *(volatile char *)0 = 0;
  char *cur_weakref = (char *)*weakref;
  do {
    if (aligned_ref(cur_weakref) != aligned_ref(old_weakref)) {
      ref->count--;
      break;
    }
  } while (!atomic_compare_exchange_weak(weakref, (void **)&cur_weakref,
                                         cur_weakref - 1));
  return ref;
}

void put_ref(struct ref *ref) {
  if (!--ref->count) ref->free(ref);
};

void set_weakref(void *_Atomic *weakref, struct ref *ref) {
  union aligned_ref *new_weakref = 0;
  if (ref) {
    (new_weakref = aligned_ref(ref->_aligned_ref))->ref = ref;
    ref->count += sizeof(union aligned_ref) + 1;
  }
  char *old_weakref = (char *)atomic_exchange(weakref, new_weakref);
  if (!old_weakref) return;
  struct ref *old_ref = aligned_ref(old_weakref)->ref;
  old_ref->count += old_weakref - (char *)aligned_ref(old_weakref) -
                    sizeof(union aligned_ref);
  put_ref(old_ref);
}
