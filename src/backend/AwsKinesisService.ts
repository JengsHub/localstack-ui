import AWS from "aws-sdk";

AWS.config.update({
  region: "us-east-1", // Replace with your desired region
  accessKeyId: "YOUR_ACCESS_KEY_ID",
  secretAccessKey: "YOUR_SECRET_ACCESS_KEY",
});

class AWSKinesisService {
  private kinesis: AWS.Kinesis;

  constructor(localstackEndpoint: string) {
    this.kinesis = new AWS.Kinesis({ endpoint: localstackEndpoint });
  }

  createKinesisStream = async (streamName: string, shardCount: number) => {
    try {
      const params: AWS.Kinesis.CreateStreamInput = {
        StreamName: streamName,
        ShardCount: shardCount,
      };

      const response = await this.kinesis.createStream(params).promise();
      alert(
        "Kinesis stream created:" + response.$response.httpResponse.statusCode
      );
      console.log("Kinesis stream created:", response);
      return response;
      // checkAllKinesisStreams();
    } catch (error) {
      console.error("Error creating Kinesis stream:", error);
    }
  };

  deleteKinesisStream = async (streamName: string) => {
    try {
      const response = await this.kinesis
        .deleteStream({ StreamName: streamName })
        .promise();
      console.log(
        `Kinesis stream "${streamName}" deleted successfully.`,
        response
      );
      alert(
        "Kinesis stream created:" + response.$response.httpResponse.statusCode
      );
      return response;
      // checkAllKinesisStreams();
    } catch (error) {
      console.log("Error deleting Kinesis stream:", error);
    }
  };

  checkAllKinesisStreams = async () => {
    //todo fix bug, seems like deletion doesnt happen even after response is returned
    try {
      const response = await this.kinesis.listStreams().promise();
      const streamNames = response.StreamNames;

      console.log("List of Kinesis Streams:");
      streamNames.forEach((streamName: string) => {
        console.log(streamName);
      });
      return streamNames;
      // setStreams(streamNames);
    } catch (error) {
      console.log("Error listing Kinesis streams:", error);
      return null;
    }
  };

  getShardIterator = async (
    streamName: string,
    shardId: string,
    shardIteratorType: string
  ) => {
    try {
      const params: AWS.Kinesis.GetShardIteratorInput = {
        StreamName: streamName,
        ShardId: shardId,
        ShardIteratorType: shardIteratorType, // Specify the desired iterator type
      };

      const response = await this.kinesis.getShardIterator(params).promise();
      const shardIterator = response.ShardIterator;

      console.log("Shard Iterator:", shardIterator);
      return shardIterator;
    } catch (error) {
      console.error("Error getting shard iterator:", error);
    }
  };

  consumeDataFromKinesisStream = async (shardIterator: string) => {
    try {
      //todo handle the logic fir this limit
      const params: AWS.Kinesis.GetRecordsInput = {
        ShardIterator: shardIterator,
        Limit: 10, // Maximum number of records to retrieve per request
      };

      while (true) {
        if (shardIterator) {
          params.ShardIterator = shardIterator;
        }

        const recordsResponse = await this.kinesis.getRecords(params).promise();
        const records = recordsResponse.Records;
        console.log(records);

        let datas: string[] = [];
        let realData: KinesisStreamData[] = [];

        if (records && records.length > 0) {
          records.forEach((record) => {
            const user: KinesisStreamData = {
              SequenceNumber: record.SequenceNumber.toString(),
              ApproximateArrivalTimestamp:
                record.ApproximateArrivalTimestamp?.toString(),
              Data: record.Data.toString(),
            };
            const data = record.Data.toString();
            datas.push(data);
            realData.push(user);
            console.log("Received data from Kinesis:", data);
          });
        }

        if (recordsResponse.MillisBehindLatest === 0) {
          return realData;
        }
      }
    } catch (error) {
      console.error("Error consuming data from Kinesis stream:", error);
    }
  };

  putDataIntoKinesisStream = async (streamName: string, data: string) => {
    try {
      const params: AWS.Kinesis.PutRecordInput = {
        StreamName: streamName,
        Data: data,
        PartitionKey: "whatever", // Replace with your own partition key
      };

      const response = await this.kinesis.putRecord(params).promise();
      console.log("Data inserted into Kinesis stream:", response);
      return response;
    } catch (error) {
      console.error("Error inserting data into Kinesis stream:", error);
    }
  };
}

export interface KinesisStreamData {
  SequenceNumber: string;
  ApproximateArrivalTimestamp?: string;
  Data: string;
}

export default AWSKinesisService;
