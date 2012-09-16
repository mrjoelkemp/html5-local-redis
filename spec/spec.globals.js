// Use sessionStorage for temporarily storing dummy data
// and not tainting existing localStorage data
// Also allows us to avoid worrying about destroying localhost data
var localRedis  = localRedis || {},
    storage     = localRedis,  // Alias for specs
    stringify   = JSON.stringify;

afterEach(function () {
  // It's not enough to rely on sessionStorage to
  // flush since it only flushes on a crash
  storage.clear();
});