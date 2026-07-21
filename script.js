const content = {
  jokes: [
    "I told my computer I needed a break, and it said no problem, it'll go to sleep.",
    "Why don't scientists trust atoms? Because they make up everything.",
    "I'm reading a book about anti-gravity. It's impossible to put down.",
    "Why did the scarecrow win an award? He was outstanding in his field.",
    "I used to be a banker, but I lost interest.",
    "Parallel lines have so much in common. It's a shame they'll never meet.",
    "Why don't skeletons fight each other? They don't have the guts.",
    "I only know 25 letters of the alphabet. I don't know y.",
    "What do you call a fish with no eyes? A fsh.",
    "I told a chemistry joke, but there was no reaction.",
    "Why did the bicycle fall over? It was two tired.",
    "I'm on a seafood diet. I see food and I eat it.",
    "What do you call fake spaghetti? An impasta.",
    "Why can't you give Elsa a balloon? Because she'll let it go.",
    "I would tell you a joke about pizza, but it's a little cheesy.",
  ],
  pickupLines: [
    "Are you a magician? Because whenever I look at you, everyone else disappears.",
    "Do you have a map? I keep getting lost in your eyes.",
    "Is your name Google? Because you have everything I've been searching for.",
    "Are you made of copper and tellurium? Because you're Cu-Te.",
    "If you were a vegetable, you'd be a cute-cumber.",
    "Do you have a sunburn, or are you always this hot?",
    "Are you a parking ticket? Because you've got fine written all over you.",
    "I must be a snowflake, because I've fallen for you.",
    "Is there an airport nearby, or is that just my heart taking off?",
    "Are you Wi-Fi? Because I'm really feeling a connection.",
    "You must be tired, because you've been running through my mind all day.",
    "Are you a camera? Because every time I look at you, I smile.",
    "Do you believe in love at first sight, or should I walk by again?",
    "Are you a loan? Because you have my interest.",
    "Is it hot in here, or is it just you?",
  ],
  poetry: [
    "Roses are red,\nViolets are blue,\nI forgot the rest,\nBut I still like you.",
    "I asked my cat for advice on love,\nHe stared at me, then coughed up a glove.\nWisdom, it seems, is hard to find,\nEspecially from a feline mind.",
    "There once was a man from the coast,\nWho tried to reheat his own toast.\nIt caught on fire,\nHe called it 'attire',\nAnd wore it as a warm crispy roast.",
    "The moon is round,\nThe stars are bright,\nMy pizza fell,\nCheese-side, tonight.",
    "Twinkle twinkle little Wi-Fi,\nWhy won't you connect, oh why?\nUp above the router so high,\nLike a signal lost in the sky.",
    "I wandered lonely as a cloud,\nUntil I tripped and yelled real loud.\nThe cloud looked down and had a laugh,\nThen rained on me, just for a gaff.",
    "Sugar is sweet,\nAnd so are you,\nBut my code just crashed,\nAnd now I'm blue.",
    "A poet once tried to rhyme with 'orange',\nHe thought and thought, it was quite the challenge.\nHe gave up in the end,\nAnd wrote about a friend,\nWho lived inside a fridge for storage.",
  ],
};

const categoryLabels = {
  jokes: "Joke",
  pickupLines: "Pickup Line",
  poetry: "Poetry",
};

const picker = document.getElementById("picker");
const result = document.getElementById("result");
const categoryLabel = document.getElementById("category-label");
const resultText = document.getElementById("result-text");
const anotherBtn = document.getElementById("another-btn");
const backBtn = document.getElementById("back-btn");

let currentCategory = null;
let lastIndex = -1;

function pickRandom(category) {
  const list = content[category];
  let index;
  do {
    index = Math.floor(Math.random() * list.length);
  } while (list.length > 1 && index === lastIndex);
  lastIndex = index;
  return list[index];
}

function showResult(category) {
  currentCategory = category;
  categoryLabel.textContent = categoryLabels[category];
  resultText.textContent = pickRandom(category);
  picker.classList.add("hidden");
  result.classList.remove("hidden");
}

document.querySelectorAll(".choice-btn").forEach((btn) => {
  btn.addEventListener("click", () => showResult(btn.dataset.category));
});

anotherBtn.addEventListener("click", () => {
  resultText.textContent = pickRandom(currentCategory);
});

backBtn.addEventListener("click", () => {
  result.classList.add("hidden");
  picker.classList.remove("hidden");
  lastIndex = -1;
});
