#include <arpa/inet.h>
#include <assert.h>
#include <linux/netfilter_ipv4.h>
#include <netinet/ip.h>
#include <node_api.h>
#include <stdio.h>
#include <string.h>
#include <sys/socket.h>

napi_value original_dst(napi_env env, napi_callback_info info) {
  napi_value argv[1];
  size_t argc = sizeof argv / sizeof *argv;
  assert(!napi_get_cb_info(env, info, &argc, argv, 0, 0));

  assert(argc == 1);
  int fd;
  assert(!napi_get_value_int32(env, argv[0], &fd));

  struct sockaddr_in addr;
  socklen_t addr_size = sizeof addr;
  if (getsockopt(fd, SOL_IP, SO_ORIGINAL_DST, &addr, &addr_size)) {
    napi_throw_error(env, 0, "getsockopt did not succeeed");
    return 0;
  }

  char ip[1024];
  inet_ntop(AF_INET, &addr.sin_addr, ip, sizeof ip);
  int port = ntohs(addr.sin_port);
  char host[1024];
  assert(snprintf(host, sizeof host, "%s:%i", ip, port) < (int)sizeof host);

  napi_value host_node;
  assert(!napi_create_string_latin1(env, host, strlen(host), &host_node));
  return host_node;
}

#define NODE_FUNC(func) {#func, 0, func, 0, 0, 0, napi_default, 0}

napi_value Init(napi_env env, napi_value exports) {
  napi_property_descriptor desc = NODE_FUNC(original_dst);
  assert(!napi_define_properties(env, exports, 1, &desc));
  return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
