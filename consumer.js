const { Kafka } = require("kafkajs");

async function runConsumer() {
  try {
    // Same ngrok address
    const kafka = new Kafka({
      clientId: "my-consumer",
      brokers: ["0.tcp.in.ngrok.io:12262"],
    });

    const consumer = kafka.consumer({ groupId: "login-click-group" });
    await consumer.connect();
    await consumer.subscribe({ topic: "login-clicks", fromBeginning: true });

    console.log("Consumer connected, listening for login-click messages...");

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const prefix = `${topic}[${partition} | ${message.offset}] / ${message.timestamp}`;
        const decodedValue = message.value.toString();
        console.log(`\n${prefix} - ${decodedValue}`);
      },
    });
  } catch (error) {
    console.error("Error in consumer:", error);
  }
}

runConsumer();
