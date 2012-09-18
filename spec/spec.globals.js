// Use sessionStorage for temporarily storing dummy data
// and not tainting existing localStorage data
// Also allows us to avoid worrying about destroying localhost data
var storage     = window.sessionRedis,  // Alias for specs
    stringify   = JSON.stringify;

window.beforeEach(function () {
  // It's not enough to rely on sessionStorage to
  // flush since it only flushes on a crash
  storage.clear();
});