// src/utils/kafkaClient.js
import { Kafka } from "kafkajs";

let kafka;
let producer;

export const getKafkaProducer = async () => {
  if (!kafka) {
    kafka = new Kafka({
      clientId: "my-nextjs-client",
      // Make sure this matches your KAFKA_ADVERTISED_LISTENERS
      brokers: ["0.tcp.in.ngrok.io:17346"],
    });
  }

  if (!producer) {
    producer = kafka.producer();
    await producer.connect();
  }

  return producer;
};
