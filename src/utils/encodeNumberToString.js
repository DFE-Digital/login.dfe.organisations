const encode = (number, charset, minLength = 7) => {
  let encoded = '';

  const snum = number.toString();
  for(let i = 0; i < snum.length; i++) {
    const multiplier = i % 2 === 0 ? 1 : 2;
    const index = parseInt(snum[i]) * multiplier;
    encoded += charset.main[index];
  }

  while(encoded.length < minLength) {
    encoded += charset.pad[Math.floor(Math.random() * charset.pad.length)];
  }

  return encoded;
};

const encodeNumberToString = (number) => {
  const option1 = encode(number, {
    main: 'jhrz9ck37p5x2myb8g6w',
    pad: '4dfen',
  });
  const option2 = encode(number, {
    main: 'h7r3j6kpf48bmyengw2x',
    pad: 'zd9c5',
  });
  const option3 = encode(number, {
    main: 'p4wgfbe9526m8rdzxyh7',
    pad: 'kcnj3',
  });
  const option4 = encode(number, {
    main: 'mpfjy3zn69r47ghxcd5b',
    pad: 'ewk82',
  });
  const option5 = encode(number, {
    main: 'gzx9wnym7p6jd3e8k5b2',
    pad: '4rhcf',
  });

  return {
    option1,
    option2,
    option3,
    option4,
    option5,
  };
};

module.exports = encodeNumberToString;