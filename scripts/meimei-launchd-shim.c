#include <launch.h>
#include <fcntl.h>
#include <sys/socket.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

static void die(const char *msg) {
  perror(msg);
  exit(1);
}

int main(int argc, char **argv) {
  if (argc < 2) {
    fprintf(stderr, "usage: %s <program> [args...]\n", argv[0]);
    return 2;
  }

  int *fds = NULL;
  size_t count = 0;
  int rc = launch_activate_socket("Listener", &fds, &count);
  if (rc != 0) {
    fprintf(stderr, "launch_activate_socket failed: %d\n", rc);
    return 1;
  }
  if (count < 1) {
    fprintf(stderr, "launch_activate_socket returned no sockets\n");
    return 1;
  }

  if (fds[0] != 3) {
    if (dup2(fds[0], 3) < 0) die("dup2");
    close(fds[0]);
  }
  int acceptConn = 0;
  socklen_t len = sizeof(acceptConn);
  if (getsockopt(3, SOL_SOCKET, SO_ACCEPTCONN, &acceptConn, &len) < 0) die("getsockopt");
  if (!acceptConn) {
    if (listen(3, 128) < 0) die("listen");
  }
  free(fds);

  setenv("MEIMEI_LAUNCHD_SOCKET", "1", 1);
  execvp(argv[1], &argv[1]);
  die("execvp");
  return 1;
}
