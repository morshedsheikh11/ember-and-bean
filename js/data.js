/* Menu content. `img` is an Unsplash photo id. */
window.EB_MENU = [
  { id: 'coffee', label: 'Coffee', items: [
    { id: 'espresso', name: 'Double Espresso', desc: 'Our house blend, syrupy with dark cocoa and cherry.', price: 9, img: '1610889556528-9a770e32642f' },
    { id: 'flat-white', name: 'Flat White', desc: 'Velvety microfoam over a double ristretto.', price: 14, img: '1577968897966-3d4325b36b61' },
    { id: 'cappuccino', name: 'Cappuccino', desc: 'Equal parts espresso, steamed milk and soft foam.', price: 14, img: '1509042239860-f550ce710b93' },
    { id: 'spanish-latte', name: 'Iced Spanish Latte', desc: 'Espresso over ice with sweetened condensed milk.', price: 17, img: '1517701550927-30cf4ba1dba5' },
    { id: 'mocha', name: 'Ember Mocha', desc: 'Espresso, 70% dark chocolate and a pinch of sea salt.', price: 16, img: '1618576230663-9714aecfb99a' },
    { id: 'cold-brew', name: 'Slow Cold Brew', desc: 'Steeped for 18 hours. Clean, sweet and bright.', price: 15, img: '1759259639356-6eee63241869' },
  ]},
  { id: 'non-coffee', label: 'Non-Coffee', items: [
    { id: 'matcha', name: 'Uji Matcha Latte', desc: 'Stone-ground Japanese matcha with steamed milk.', price: 16, img: '1515823064-d6e0c04616a7' },
    { id: 'hot-choc', name: 'Dark Hot Chocolate', desc: 'Melted Pahang cocoa, whole milk, not too sweet.', price: 15, img: '1542990253-0d0f5be5f0ed' },
    { id: 'chai', name: 'Masala Chai', desc: 'Black tea simmered with ginger, cardamom and clove.', price: 14, img: '1761483281417-778013dc0177' },
    { id: 'iced-tea', name: 'Iced Lemon Tea', desc: 'Cold-steeped black tea with fresh lemon and mint.', price: 12, img: '1556679343-c7306c1976bc' },
    { id: 'orange', name: 'Fresh Orange Juice', desc: 'Pressed to order, nothing added.', price: 13, img: '1600271886742-f049cd451bba' },
  ]},
  { id: 'breakfast', label: 'Breakfast', items: [
    { id: 'avo-toast', name: 'Smashed Avocado Toast', desc: 'House sourdough, lemon, chilli flakes and sea salt.', price: 24, img: '1588137378633-dea1336ce1e2' },
    { id: 'benedict', name: 'Eggs Benedict', desc: 'Poached eggs, smoked beef and brown butter hollandaise.', price: 28, img: '1785697249208-749c906b69b0' },
    { id: 'pancakes', name: 'Buttermilk Pancakes', desc: 'A fluffy stack with berries and maple syrup.', price: 24, img: '1612182062633-9ff3b3598e96' },
    { id: 'granola', name: 'Granola & Yoghurt Bowl', desc: 'Toasted house granola, Greek yoghurt and fresh berries.', price: 20, img: '1692071106919-01bc0b9b0919' },
    { id: 'croissant', name: 'Butter Croissant', desc: 'Laminated for three days, baked every morning.', price: 11, img: '1681218079567-35aef7c8e7e4' },
    { id: 'shakshuka', name: 'Shakshuka', desc: 'Eggs baked in spiced tomato, served with toasted bread.', price: 26, img: '1757972367524-5272633a75df' },
  ]},
  { id: 'mains', label: 'Mains', items: [
    { id: 'nasi-lemak', name: 'Nasi Lemak Ayam Berempah', desc: 'Coconut rice, spiced fried chicken and slow-cooked sambal.', price: 26, img: '1770966485209-e20d97337f1a' },
    { id: 'pasta', name: 'Truffle Cream Fettuccine', desc: 'Fresh pasta, parmesan and cracked black pepper.', price: 32, img: '1608219992759-8d74ed8d76eb' },
    { id: 'salmon', name: 'Pan-Seared Salmon', desc: 'Crisp-skinned fillet with seasonal greens and lemon.', price: 42, img: '1519708227418-c8fd9a32b7a2' },
    { id: 'burger', name: 'The Ember Burger', desc: 'Grilled beef patty, cheddar and pickles in a brioche bun.', price: 34, img: '1550547660-d9450f859349' },
    { id: 'caesar', name: 'Chicken Caesar Salad', desc: 'Romaine, grilled chicken, shaved parmesan and croutons.', price: 25, img: '1746211108786-ca20c8f80ecd' },
    { id: 'club', name: 'Toasted Club Sandwich', desc: 'Smoked chicken, egg and tomato, served with fries.', price: 27, img: '1676300184084-de35d56a9a70' },
  ]},
  { id: 'desserts', label: 'Desserts', items: [
    { id: 'basque', name: 'Burnt Basque Cheesecake', desc: 'Caramelised top with a soft, creamy middle.', price: 18, img: '1635327173758-85badf17f995' },
    { id: 'tiramisu', name: 'Espresso Tiramisu', desc: 'Soaked in our own espresso, dusted with dark cocoa.', price: 18, img: '1571877227200-a0d98ea607e9' },
    { id: 'lava', name: 'Chocolate Lava Cake', desc: 'Warm molten centre with a scoop of vanilla ice cream.', price: 19, img: '1673551490812-eaee2e9bf0ef' },
    { id: 'cinnamon', name: 'Cinnamon Roll', desc: 'Soft, sticky and glazed. Best while still warm.', price: 12, img: '1764281469526-e1c378515e6f' },
    { id: 'banana', name: 'Banana Bread', desc: 'Pisang-rich slice, toasted with salted butter.', price: 10, img: '1767065887793-f68f736ea9d6' },
  ]},
];

/* Opening hours in minutes from midnight, indexed by Date.getDay() */
window.EB_HOURS = [
  [480, 1260],  // Sunday
  [450, 1260],  // Monday
  [450, 1260],
  [450, 1260],
  [450, 1260],
  [450, 1320],  // Friday
  [480, 1320],  // Saturday
];
