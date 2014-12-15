define(['utils'], function (_) {
  describe('utility', function () {

      it('should have composable hash function for string', function () {
        var first = "95430nv0y30gvn9p43gvgn349",
            firstOneCharAdd = first + "a",
            second = "4y4mvy598n3059m3986",
            combined = first + second;

        var firstHash = _.hash(first);
        expect(firstHash).toBe(_.hash(first));
        expect(firstHash > 0).toBe(true);
        expect(firstHash).not.toBe(_.hash(firstOneCharAdd));

        expect(_.hash(second, firstHash)).toBe(_.hash(combined));
      });

      it('should handle html entities', function () {
        expect(_.decodeHtmlEntities('&lt;te&#x27;st&gt;')).toBe('<te\'st>');
      });

  });
});
