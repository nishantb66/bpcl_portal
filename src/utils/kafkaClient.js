import { Kafka } from "kafkajs";

let kafka;
let producer;

export const getKafkaProducer = async () => {
  if (!kafka) {
    kafka = new Kafka({
      clientId: "my-nextjs-client",
      // The broker is your ngrok TCP address
      brokers: ["0.tcp.in.ngrok.io:17419"],
    });
  }

  if (!producer) {
    producer = kafka.producer();
    await producer.connect();
  }

  return producer;
};
