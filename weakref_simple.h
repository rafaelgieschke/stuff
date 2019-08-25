#include <stdatomic.h>
#include <stdint.h>

struct ref {
  _Atomic long count;
  void (*free)(struct ref *ref);
};

struct ref *get_ref(void *_Atomic *weakref) {
  uintptr_t _Atomic *_weakref = (uintptr_t _Atomic *)weakref, ref;
  while ((ref = atomic_fetch_or(_weakref, 1)) & 1);
  if (ref && ++((struct ref *)ref)->count == -1) *(volatile char *)0 = 0;
  if (!atomic_compare_exchange_strong(_weakref, &(struct { uintptr_t _; })
      {ref | 1}._, ref) && ref) ((struct ref *)ref)->count--;
  return (struct ref *)ref;
}

void put_ref(struct ref *ref) {
  if (!--ref->count) ref->free(ref);
}

void set_weakref(void *_Atomic *weakref, struct ref *ref) {
  if (ref) ref->count += 1;
  uintptr_t old_ref = (uintptr_t)atomic_exchange(weakref, (void *)ref);
  if (old_ref && !(old_ref & 1)) put_ref((struct ref *)old_ref);
}
