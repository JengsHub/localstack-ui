import React, { useState } from "react";
import "./App.css";
import AWSKinesisService, {
  KinesisStreamData,
} from "./backend/AwsKinesisService";

function App() {
  const [localstackEndpoint, setLocalstackEndpoint] = useState<string>(
    "http://localhost:4566"
  );

  const [streams, setStreams] = useState<string[]>([]);

  const [data, setData] = useState<string>("");

  const [streamName, setStreamName] = useState<string>("");
  const [shardCount, setShardCount] = useState<number>(0);

  const [shardIterator, setShardIterator] = useState<string>(
    "No Shard Iterator can be found"
  );

  const [streamData, setStreamData] = useState<KinesisStreamData[]>([]);
  // const kinesis = new AWS.Kinesis({ endpoint: localstackEndpoint });

  const kinesis = new AWSKinesisService(localstackEndpoint);

  const handleCreateStream = async () => {
    await kinesis.createKinesisStream(streamName, shardCount);
  };

  const handleDeleteStream = async () => {
    await kinesis.deleteKinesisStream(streamName);
  };

  const handleCheckStreams = async () => {
    let streamNames = await kinesis.checkAllKinesisStreams();
    if (streamNames) {
      setStreams(streamNames);
    }
  };

  const getShardIterator = async () => {
    let shardIterator = await kinesis.getShardIterator(
      streamName,
      "shardId-000000000000",
      "TRIM_HORIZON"
    );
    if (shardIterator) {
      setShardIterator(shardIterator);
    }
  };

  const consumeDataFromKinesisStream = async () => {
    let data = await kinesis.consumeDataFromKinesisStream(shardIterator);
    if (data) {
      setStreamData(data);
    }
  };

  const putDataIntoKinesisStream = async (data: string) => {
    await kinesis.putDataIntoKinesisStream(streamName, data);
  };

  return (
    <div className="App">
      <h1 className="header"> Localstack-ui Lite</h1>
      <div>
        <p className="text-box">
          Enter your localstack endpoint -
          <input
            type="text"
            value={localstackEndpoint}
            className="text-input"
            onChange={(e) => setLocalstackEndpoint(e.target.value)}
          />
        </p>
      </div>
      <div>
        <h2>Please enter your stream details</h2>
        <div>
          <p>
            What is your stream name?{" "}
            <input
              placeholder="Stream name"
              onChange={(e) => setStreamName(e.target.value)}
            ></input>
          </p>
          <p>
            How many shards would you like for this stream?{" "}
            <input
              placeholder="Number of shards"
              onChange={(e) => setShardCount(parseInt(e.target.value))}
            ></input>
          </p>
        </div>
      </div>
      <div className="button-container">
        <button onClick={handleCreateStream}>Create Stream</button>
        <button onClick={handleDeleteStream} className="delete">
          Delete Stream
        </button>
      </div>
      <div>
        <h2>Your streams:</h2>
        {streams.length === 0 ? (
          <p>
            No streams can be found. If you've just created/deleted a stream,
            please check streams again.
          </p>
        ) : (
          streams.map((streamName, index) => (
            <div key={index}>{streamName}</div>
          ))
        )}

        <div className="section">
          <button onClick={handleCheckStreams}>Check streams</button>
        </div>
      </div>

      <h2>Push data into your stream</h2>
      <input
        onChange={(e) => setData(e.target.value)}
        className="text-input"
      ></input>
      <button
        onClick={() => putDataIntoKinesisStream(data)}
        style={{ marginLeft: "10px" }}
      >
        Push into stream
      </button>

      <div>
        <div>
          <h3>Generate shard iterator:</h3>
          <p className="text-box">{shardIterator}</p>
        </div>
        <button onClick={getShardIterator}>GetShardIterator</button>
      </div>

      <div>
        <div>
          <h3>Your data:</h3>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom:"10px" }}>
            {streamData.length === 0 ? (
              <p>insert data pls bro</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Seq Number</th>
                    <th>Approx Arrival Time</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {streamData.map((streamName, index) => (
                    <tr key={index}>
                      <td>{streamName.SequenceNumber}</td>
                      <td>{streamName.ApproximateArrivalTimestamp}</td>
                      <td>{streamName.Data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      <button onClick={consumeDataFromKinesisStream}>
        Consume Data from kinesis
      </button>
    </div>
  );
}

export default App;
