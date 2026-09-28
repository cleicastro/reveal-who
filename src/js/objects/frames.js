// Central atlas frame table. Indices verified by visual inspection of the
// generated contact sheets (small/big Mario, enemies, items).

var frames = {
  mario: {
    small: {
      stand: 14,
      walk: [15, 14],
      run: [15, 14],
      spin: [20, 21, 14],
      jumpUp: 1,
      jumpDown: 3,
      crouch: 49,
      lookUp: 9,
      bodyW: 13,
      bodyH: 15
    },
    big: {
      stand: 105,
      walk: [106, 105],
      run: [109, 110],
      spin: [109, 110, 105],
      jumpUp: 111,
      jumpDown: 112,
      crouch: 124,
      lookUp: 123,
      bodyW: 14,
      bodyH: 26
    }
  },

  // items atlas
  coin: [4, 5, 6, 7],
  mushroom: 25,
  qblock: [144, 145, 146, 147],
  usedBlock: 149,

  // enemies atlas
  goomba: {
    walk: [26, 27],
    squashed: 37
  },
  koopa: {
    walk: [14, 15],
    shell: 30,
    shellSpin: [30, 31, 32, 33]
  }
};

export default frames;
