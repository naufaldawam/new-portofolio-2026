let aiModel = null;
let aiVocabulary = [];
let aiIntents = [];
let aiReady = false;

function aiTokenize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
}

function buildAIVocabulary() {
  const words = new Set();
  trainingData.forEach(item => aiTokenize(item.text).forEach(word => words.add(word)));
  aiVocabulary = [...words];
  aiIntents = [...new Set(trainingData.map(item => item.intent))];
}

function aiVectorize(text) {
  const words = aiTokenize(text);
  return aiVocabulary.map(word => words.includes(word) ? 1 : 0);
}

async function trainPortfolioAI() {
  if (aiReady) return;

  buildAIVocabulary();

  const xs = tf.tensor2d(trainingData.map(item => aiVectorize(item.text)));
  const ys = tf.tensor2d(trainingData.map(item => {
    const output = Array(aiIntents.length).fill(0);
    output[aiIntents.indexOf(item.intent)] = 1;
    return output;
  }));

  aiModel = tf.sequential();
  aiModel.add(tf.layers.dense({ inputShape: [aiVocabulary.length], units: 24, activation: "relu" }));
  aiModel.add(tf.layers.dropout({ rate: 0.15 }));
  aiModel.add(tf.layers.dense({ units: aiIntents.length, activation: "softmax" }));
  aiModel.compile({ optimizer: tf.train.adam(0.01), loss: "categoricalCrossentropy", metrics: ["accuracy"] });

  await aiModel.fit(xs, ys, { epochs: 180, shuffle: true, verbose: 0 });

  xs.dispose();
  ys.dispose();
  aiReady = true;
}

async function predictPortfolioIntent(question) {
  await trainPortfolioAI();

  const input = tf.tensor2d([aiVectorize(question)]);
  const prediction = aiModel.predict(input);
  const probabilities = await prediction.data();

  let index = 0;
  for (let i = 1; i < probabilities.length; i++) {
    if (probabilities[i] > probabilities[index]) index = i;
  }

  const confidence = probabilities[index];
  input.dispose();
  prediction.dispose();

  return { intent: aiIntents[index], confidence };
}

function portfolioAIAnswer(intent) {
  const answers = {
    project: {
      text: "Naufal punya beberapa featured works, mulai dari Integrasi AI MKRI, Sales Order iProm PNRE, MCU Dashboard PNRE, EDRT JMRB, Pencatatan BBM PNRE, sampai Webview Martipay dan Payment Method ZISWAF.",
      action: "#portfolio",
      label: "View works"
    },
    experience: {
      text: "Journey Naufal mencakup Backend Developer di PT. PLN Icon Plus, Java Programmer di PT. Bank DKI / PT. Bank Jakarta, IT Support di PT. Polaris Edu Partners, Technical Engineer di CV. Cipta Indah Karya Sportindo, Technical Writer, dan Intern Front-end Developer di Mola.Tv.",
      action: "#journey",
      label: "View journey"
    },
    skill: {
      text: "Tech stack yang ditampilkan di portfolio ini mencakup Java Spring Boot, .NET, Laravel, Gin, React JS, Next JS, Vue JS, dan Flutter.",
      action: "#skills",
      label: "View tech stack"
    },
    contact: {
      text: "Naufal bisa dihubungi melalui WhatsApp 0812-8356-6949 atau email naufal.dawam.dz@gmail.com. CV juga tersedia di bagian About.",
      action: "#contact",
      label: "Contact Naufal"
    }
  };

  return answers[intent];
}

async function askPortfolioAI(question) {
  const result = await predictPortfolioIntent(question);

  if (result.confidence < 0.45) {
    return {
      text: "Aku belum cukup yakin dengan pertanyaan itu. Coba tanyakan tentang project, experience, skill, atau contact Naufal.",
      action: null,
      confidence: result.confidence
    };
  }

  return { ...portfolioAIAnswer(result.intent), confidence: result.confidence };
}

window.portfolioAI = {
  train: trainPortfolioAI,
  ask: askPortfolioAI
};
