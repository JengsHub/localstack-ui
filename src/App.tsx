import React, { useState } from "react";
import "./App.css";
import AWS from "aws-sdk";

function App() {
  const [localstackEndpoint, setLocalstackEndpoint] = useState<string>(
    "http://localhost:4566"
  );

  const [streams, setStreams] = useState<string[]>([]);

  const [data, setData] = useState<string>("");
  const [shardIterator, setShardIterator] =
    useState<string>("doesnt exist bro");

  const [streamData, setStreamData] = useState<string[]>([]);
  const kinesis = new AWS.Kinesis({ endpoint: localstackEndpoint });

  const createKinesisStream = async (
    streamName: string,
    shardCount: number
  ) => {
    try {
      const params: AWS.Kinesis.CreateStreamInput = {
        StreamName: streamName,
        ShardCount: shardCount,
      };

      const response = await kinesis.createStream(params).promise();
      alert(
        "Kinesis stream created:" + response.$response.httpResponse.statusCode
      );
      console.log("Kinesis stream created:", response);
      checkAllKinesisStreams();
    } catch (error) {
      console.error("Error creating Kinesis stream:", error);
    }
  };

  const deleteKinesisStream = async (streamName: string) => {
    try {
      const response = await kinesis
        .deleteStream({ StreamName: streamName })
        .promise();
      console.log(
        `Kinesis stream "${streamName}" deleted successfully.`,
        response
      );
      // checkAllKinesisStreams();
    } catch (error) {
      console.log("Error deleting Kinesis stream:", error);
    }
  };

  const checkAllKinesisStreams = async () => {
    //todo fix bug, seems like deletion doesnt happen even after response is returned
    try {
      const response = await kinesis.listStreams().promise();
      const streamNames = response.StreamNames;

      console.log("List of Kinesis Streams:");
      streamNames.forEach((streamName: string) => {
        console.log(streamName);
      });
      setStreams(streamNames);
    } catch (error) {
      console.log("Error listing Kinesis streams:", error);
    }
  };

  const getShardIterator = async () => {
    try {
      const params: AWS.Kinesis.GetShardIteratorInput = {
        StreamName: "test-stream",
        ShardId: "shardId-000000000000",
        ShardIteratorType: "TRIM_HORIZON", // Specify the desired iterator type
      };

      const response = await kinesis.getShardIterator(params).promise();
      const shardIterator = response.ShardIterator;
      setShardIterator(shardIterator ? shardIterator : "");

      console.log("Shard Iterator:", shardIterator);
    } catch (error) {
      console.error("Error getting shard iterator:", error);
    }
  };

  const consumeDataFromKinesisStream = async () => {
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

        const recordsResponse = await kinesis.getRecords(params).promise();
        const records = recordsResponse.Records;
        console.log(records);

        if (records && records.length > 0) {
          let datas: string[] = [];
          records.forEach((record) => {
            const data = record.Data.toString();
            datas.push(data);
            console.log("Received data from Kinesis:", data);
          });
          setStreamData(datas);
        }

        if (recordsResponse.MillisBehindLatest === 0) {
          setShardIterator("done bro");
          break; // No more records to retrieve
        }
        setShardIterator(
          recordsResponse.NextShardIterator
            ? recordsResponse.NextShardIterator
            : "done bro"
        );
      }
    } catch (error) {
      console.error("Error consuming data from Kinesis stream:", error);
    }
  };

  AWS.config.update({
    region: "us-east-1", // Replace with your desired region
    accessKeyId: "YOUR_ACCESS_KEY_ID",
    secretAccessKey: "YOUR_SECRET_ACCESS_KEY",
  });

  const handleClick = () => {
    createKinesisStream("test-stream", 1);
    // console.log("woi");
  };

  const handleDeleteStream = () => {
    deleteKinesisStream("test-stream");
    // console.log("woi");
  };

  const handleCheckStreams = () => {
    checkAllKinesisStreams();
    // console.log("woi");
  };

  const putDataIntoKinesisStream = async () => {
    try {
      const params: AWS.Kinesis.PutRecordInput = {
        StreamName: "test-stream",
        Data: data,
        PartitionKey: "whatever", // Replace with your own partition key
      };

      const response = await kinesis.putRecord(params).promise();
      console.log("Data inserted into Kinesis stream:", response);
    } catch (error) {
      console.error("Error inserting data into Kinesis stream:", error);
    }
  };

  return (
    <div className="App">
      <h1> Localstack-ui Lite</h1>
      <div>
        <p>
          Enter your localstack endpoint-
          <input
            type="text"
            value={localstackEndpoint}
            onChange={(e) => setLocalstackEndpoint(e.target.value)}
          />
        </p>
      </div>
      <div>
        <button onClick={handleClick}>Create Stream</button>
        <button onClick={handleDeleteStream}>Delete Stream</button>
      </div>

      <div>
        <button onClick={handleCheckStreams}>Check streams</button>
      </div>
      <div>
        <h2>Your streams:</h2>
        {streams.length === 0 ? (
          <p>please create some streams bro</p>
        ) : (
          streams.map((streamName, index) => (
            <div key={index}>{streamName}</div>
          ))
        )}
      </div>
      <input onChange={(e) => setData(e.target.value)}></input>
      <button onClick={putDataIntoKinesisStream}>Put into stream</button>

      <div>
        <button onClick={getShardIterator}>GetShardIterator</button>
        <div>
          <h3>Your current shard iterator:</h3>
          <p style={{ wordBreak: "break-all" }}>{shardIterator}</p>
        </div>
      </div>

      <div>
        <button onClick={consumeDataFromKinesisStream}>
          Consume Data from kinesis
        </button>
        <div>
          <h3>Your data:</h3>
          <div>
            {streamData.length === 0 ? (
              <p>insert data pls bro</p>
            ) : (
              streamData.map((streamName, index) => (
                <div key={index}>{streamName}</div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
