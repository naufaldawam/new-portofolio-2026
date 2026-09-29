// let aiModel = null;
// let aiVocabulary = [];
// let aiIntents = [];
// let aiReady = false;

// function aiTokenize(text) {
//   return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
// }

// function buildAIVocabulary() {
//   const words = new Set();
//   trainingData.forEach(item => aiTokenize(item.text).forEach(word => words.add(word)));
//   aiVocabulary = [...words];
//   aiIntents = [...new Set(trainingData.map(item => item.intent))];
// }

// function aiVectorize(text) {
//   const words = aiTokenize(text);
//   return aiVocabulary.map(word => words.includes(word) ? 1 : 0);
// }

// async function trainPortfolioAI() {
//   if (aiReady) return;

//   buildAIVocabulary();

//   const xs = tf.tensor2d(trainingData.map(item => aiVectorize(item.text)));
//   const ys = tf.tensor2d(trainingData.map(item => {
//     const output = Array(aiIntents.length).fill(0);
//     output[aiIntents.indexOf(item.intent)] = 1;
//     return output;
//   }));

//   aiModel = tf.sequential();
//   aiModel.add(tf.layers.dense({ inputShape: [aiVocabulary.length], units: 24, activation: "relu" }));
//   aiModel.add(tf.layers.dropout({ rate: 0.15 }));
//   aiModel.add(tf.layers.dense({ units: aiIntents.length, activation: "softmax" }));
//   aiModel.compile({ optimizer: tf.train.adam(0.01), loss: "categoricalCrossentropy", metrics: ["accuracy"] });

//   await aiModel.fit(xs, ys, { epochs: 180, shuffle: true, verbose: 0 });

//   xs.dispose();
//   ys.dispose();
//   aiReady = true;
// }

// async function predictPortfolioIntent(question) {
//   await trainPortfolioAI();

//   const input = tf.tensor2d([aiVectorize(question)]);
//   const prediction = aiModel.predict(input);
//   const probabilities = await prediction.data();

//   let index = 0;
//   for (let i = 1; i < probabilities.length; i++) {
//     if (probabilities[i] > probabilities[index]) index = i;
//   }

//   const confidence = probabilities[index];
//   input.dispose();
//   prediction.dispose();

//   return { intent: aiIntents[index], confidence };
// }

// function portfolioAIAnswer(intent) {
//   const answers = {
//     project: {
//       text: "Naufal punya beberapa featured works, mulai dari Integrasi AI MKRI, Sales Order iProm PNRE, MCU Dashboard PNRE, EDRT JMRB, Pencatatan BBM PNRE, sampai Webview Martipay dan Payment Method ZISWAF.",
//       action: "#portfolio",
//       label: "View works"
//     },
//     experience: {
//       text: "Pengalaman Naufal mencakup Backend Developer di PT. PLN Icon Plus, Java Programmer di PT. Bank DKI / PT. Bank Jakarta, IT Support di PT. Polaris Edu Partners, Technical Engineer di CV. Cipta Indah Karya Sportindo, Technical Writer, dan Intern Front-end Developer di Mola.Tv.",
//       action: "#journey",
//       label: "View journey"
//     },
//     skill: {
//       text: "Tech stack yang ditampilkan di portfolio ini mencakup Java Spring Boot, .NET, Laravel, Gin, React JS, Next JS, Vue JS, dan Flutter.",
//       action: "#skills",
//       label: "View tech stack"
//     },
//     contact: {
//       text: "Naufal bisa dihubungi melalui WhatsApp 0812-8356-6949 atau email naufal.dawam.dz@gmail.com. CV juga tersedia di bagian About.",
//       action: "#contact",
//       label: "Contact Naufal"
//     },

//   };

//   return answers[intent];
// }

// async function askPortfolioAI(question) {
//   const result = await predictPortfolioIntent(question);

//   if (result.confidence >= 0.8) {
//     return {
//         text: result.text,
//         action: result.action,
//         confidence: result.confidence
//     };
// }

// if (result.confidence >= 0.6) {
//     return {
//         text: "Sepertinya kamu sedang menanyakan tentang project atau pengalaman Naufal. Bisa diperjelas sedikit?",
//         action: null,
//         confidence: result.confidence
//     };
// }

// if (result.confidence >= 0.45) {
//     return {
//         text: "Aku belum terlalu yakin. Kamu bisa tanya tentang project, experience, skill, education, atau contact Naufal.",
//         action: null,
//         confidence: result.confidence
//     };
// // }

// // return {
// //     text: "Maaf, aku belum memahami pertanyaan itu. Coba tanyakan sesuatu tentang Naufal.",
// //     action: null,
// //     confidence: result.confidence
// // };
//   }

//   return { ...portfolioAIAnswer(result.intent), confidence: result.confidence };
// }

// window.portfolioAI = {
//   train: trainPortfolioAI,
//   ask: askPortfolioAI
// };


let aiModel = null;
let aiVocabulary = [];
let aiIntents = [];
let aiReady = false;

function aiTokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

function buildAIVocabulary() {
  const words = new Set();

  trainingData.forEach(item => {
    aiTokenize(item.text).forEach(word => words.add(word));
  });

  aiVocabulary = [...words];
  aiIntents = [...new Set(trainingData.map(item => item.intent))];
}

function aiVectorize(text) {
  const words = aiTokenize(text);

  return aiVocabulary.map(word =>
    words.includes(word) ? 1 : 0
  );
}

async function trainPortfolioAI() {
  if (aiReady) return;

  console.log("Training Naufal AI...");

  buildAIVocabulary();

  const xs = tf.tensor2d(
    trainingData.map(item => aiVectorize(item.text))
  );

  const ys = tf.tensor2d(
    trainingData.map(item => {
      const output = Array(aiIntents.length).fill(0);
      output[aiIntents.indexOf(item.intent)] = 1;
      return output;
    })
  );

  aiModel = tf.sequential();

  aiModel.add(
    tf.layers.dense({
      inputShape: [aiVocabulary.length],
      units: 64,
      activation: "relu"
    })
  );

  aiModel.add(
    tf.layers.dropout({
      rate: 0.2
    })
  );

  aiModel.add(
    tf.layers.dense({
      units: 32,
      activation: "relu"
    })
  );

  aiModel.add(
    tf.layers.dense({
      units: aiIntents.length,
      activation: "softmax"
    })
  );

  aiModel.compile({
    optimizer: tf.train.adam(0.005),
    loss: "categoricalCrossentropy",
    metrics: ["accuracy"]
  });

  const history = await aiModel.fit(xs, ys, {
    epochs: 150,
    batchSize: 16,
    shuffle: true,
    verbose: 0
  });

  const accuracyHistory = history.history.accuracy || [];
  const accuracy = accuracyHistory.length
    ? accuracyHistory[accuracyHistory.length - 1]
    : 0;

  console.log(
    `Naufal AI trained: ${(accuracy * 100).toFixed(2)}% accuracy`
  );

  console.log("Vocabulary:", aiVocabulary.length);
  console.log("Intents:", aiIntents);

  xs.dispose();
  ys.dispose();

  aiReady = true;
}

async function predictPortfolioIntent(question) {
  await trainPortfolioAI();

  const input = tf.tensor2d([
    aiVectorize(question)
  ]);

  const prediction = aiModel.predict(input);
  const probabilities = await prediction.data();

  let index = 0;

  for (let i = 1; i < probabilities.length; i++) {
    if (probabilities[i] > probabilities[index]) {
      index = i;
    }
  }

  const intent = aiIntents[index];
  const confidence = probabilities[index];

  input.dispose();
  prediction.dispose();

  console.log("AI Prediction:", {
    question,
    intent,
    confidence,
    percentage: `${(confidence * 100).toFixed(2)}%`
  });

  return {
    intent,
    confidence
  };
}

function portfolioAIAnswer(intent) {
  const answers = {
    greeting: {
      text: "Halo! Saya Naufal AI. Saya bisa membantu menjelaskan tentang profile, project, experience, skill, education, dan contact Naufal.",
      action: null,
      label: null
    },

    about: {
      text: "Naufal adalah Software Developer dengan fokus pada pengembangan aplikasi dan backend development. Portfolio ini berisi project, pengalaman, skill, dan perjalanan profesionalnya.",
      action: "#about",
      label: "About Naufal"
    },

    project: {
      text: "Naufal punya beberapa featured works, mulai dari Integrasi AI MKRI, Sales Order iProm PNRE, MCU Dashboard PNRE, EDRT JMRB, Pencatatan BBM PNRE, Webview Martipay, sampai Payment Method ZISWAF.",
      action: "#portfolio",
      label: "View works"
    },

    experience: {
      text: "Pengalaman Naufal mencakup Backend Developer di PT. PLN Icon Plus, Java Programmer di PT. Bank DKI / PT. Bank Jakarta, IT Support di PT. Polaris Edu Partners, Technical Engineer di CV. Cipta Indah Karya Sportindo, Technical Writer, dan Intern Front-end Developer di Mola.Tv.",
      action: "#journey",
      label: "View journey"
    },

    skill: {
      text: "Tech stack yang ditampilkan di portfolio ini mencakup Java Spring Boot, .NET, Laravel, Gin, React JS, Next JS, Vue JS, dan Flutter.",
      action: "#skills",
      label: "View tech stack"
    },

    education: {
      text: "Informasi pendidikan dan pembelajaran Naufal mencakup pendidikan formal serta beberapa pengalaman bootcamp dan pembelajaran teknologi.",
      action: "#about",
      label: "View education"
    },

    contact: {
      text: "Naufal bisa dihubungi melalui WhatsApp 0812-8356-6949 atau email naufal.dawam.dz@gmail.com. CV juga tersedia di bagian About.",
      action: "#contact",
      label: "Contact Naufal"
    },

    unknown: {
      text: "Pertanyaan tersebut berada di luar informasi yang saya punya tentang Naufal. Saya bisa membantu menjelaskan tentang project, experience, skill, education, profile, atau contact Naufal.",
      action: null,
      label: null
    }
  };

  return answers[intent] || answers.unknown;
}

async function askPortfolioAI(question) {
  const result = await predictPortfolioIntent(question);
  const answer = portfolioAIAnswer(result.intent);

  if (result.intent === "unknown") {
    return {
      ...answer,
      confidence: result.confidence
    };
  }

  if (result.confidence >= 0.8) {
    return {
      ...answer,
      confidence: result.confidence
    };
  }

  if (result.confidence >= 0.6) {
    return {
      text: "Sepertinya kamu sedang menanyakan tentang " +
        result.intent +
        ". Bisa diperjelas sedikit supaya saya memberikan informasi yang lebih tepat?",
      action: null,
      label: null,
      confidence: result.confidence
    };
  }

  if (result.confidence >= 0.45) {
    return {
      text: "Saya belum terlalu yakin dengan maksud pertanyaan tersebut. Coba tanyakan tentang project, experience, skill, education, profile, atau contact Naufal.",
      action: null,
      label: null,
      confidence: result.confidence
    };
  }

  return {
    text: "Maaf, saya belum memahami pertanyaan tersebut. Saya hanya dapat membantu mengenai informasi yang ada di portfolio Naufal.",
    action: null,
    label: null,
    confidence: result.confidence
  };
}

window.portfolioAI = {
  train: trainPortfolioAI,
  ask: askPortfolioAI
};