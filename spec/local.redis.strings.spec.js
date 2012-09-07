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

  it('sets the key\'s value if the key does not exist', function () {
    storage.append('foo', 'bar');
    expect(storage._retrieve('foo')).toBe('bar');
  });

  it('does not append for non-strings, returning the original length', function () {
    storage._store('foo', 4);
    expect(storage.append('foo', 'bar')).toBe(1);
    expect(storage._retrieve('foo')).toBe(4);
  });
});