describe('append', function () {
  it('appends a string to a key\'s string value', function () {
    storage._store('foo', 'bar');
    storage.append('foo', 'car');
    expect(storage._retrieve('foo')).toBe('barcar');
  });

  it('returns the length of the new (appended) value', function () {
    storage._store('foo', 'bar');

    expect(storage.append('foo', 'car')).toBe('barcar'.length);
  });

  it('sets the key\'s value to the empty string if it does not exist', function () {
    storage.append('foo', 'bar');
    expect(storage._retrieve('foo')).toBe("");
  });
});