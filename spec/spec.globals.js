// Use sessionStorage for temporarily storing dummy data
// and not tainting existing localStorage data
// Also allows us to avoid worrying about destroying localhost data
var storage   = window.sessionStorage,
    stringify = JSON.stringify;
