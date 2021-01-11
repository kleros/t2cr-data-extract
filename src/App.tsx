import React, { FC, useCallback, useMemo, useState } from "react";
import {
  ApolloClient,
  InMemoryCache,
  gql,
  useQuery,
  ApolloProvider,
} from "@apollo/client";
import { DatePicker, Radio } from "antd";
import "./App.css";

const { RangePicker } = DatePicker;

interface MomentObj {
  valueOf: Function;
}

interface RequestProps {
  interval: Number[] | undefined;
  option: Number;
}

interface Request {
  id: string;
  timestamp: string;
  type: string;
  requester: string;
  resolutionTime: string;
}

const queryBySubmissionTime = gql`
  query GetRequests($startTime: Int!, $endTime: Int!) {
    requests(
      where: {
        timestamp_gte: $startTime
        timestamp_lte: $endTime
        result: "Accepted"
      }
    ) {
      id
      timestamp
      type
      requester
      resolutionTime
    }
  }
`;

const queryByResolutionTime = gql`
  query GetRequests($startTime: Int!, $endTime: Int!) {
    requests(
      where: {
        resolutionTime_gte: $startTime
        resolutionTime_lte: $endTime
        result: "Accepted"
      }
    ) {
      id
      timestamp
      type
      requester
      resolutionTime
    }
  }
`;

const Requests: FC<RequestProps> = ({ interval = [0, 0], option = 1 }) => {
  const { loading, error, data } = useQuery(
    option === 1 ? queryBySubmissionTime : queryByResolutionTime,
    {
      variables: { startTime: interval[0], endTime: interval[1] },
    }
  );

  return (
    <div style={{ marginTop: "48px" }}>
      {loading && <p>Loading...</p>}
      {error && <p>Error :{error.message}</p>}
      {data &&
        data.requests.map((request: Request, i: Number) => (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              marginBottom: "12px",
              border: "1px solid #f0f0f0",
              padding: "24px",
            }}
            key={i.toString()}
          >
            <a
              href={`https://tokens.kleros.io/token/${request.id.slice(
                0,
                request.id.indexOf("-")
              )}`}
            >
              Token ID: {request.id.slice(0, request.id.indexOf("-"))}
            </a>
            <p>
              Submission time:
              {new Date(Number(request.timestamp) * 1000).toUTCString()}
            </p>
            <p>Request type: {request.type}</p>
            <p>
              Requester:{" "}
              <a href={`https://etherscan.io/address/${request.requester}`}>
                {request.requester}
              </a>
            </p>
            <p>
              Resolution Time:{" "}
              {new Date(Number(request.resolutionTime) * 1000).toUTCString()}
            </p>
          </div>
        ))}
    </div>
  );
};

const App: FC = () => {
  const [interval, setInterval] = useState<Number[]>();
  const [filterBy, setFilterBy] = useState<number>(1);

  const onFilterSelected = useCallback((e) => {
    setFilterBy(e.target.value || 1);
  }, []);
  const onIntervalSelected = useCallback((selectedDates) => {
    if (!selectedDates) return;
    setInterval(
      selectedDates.map((i: MomentObj) => Math.floor(i.valueOf() / 1000))
    );
  }, []);

  const client = useMemo(
    () =>
      new ApolloClient({
        uri:
          "https://api.thegraph.com/subgraphs/name/mtsalenc/t2cr-data-extract",
        cache: new InMemoryCache(),
      }),
    []
  );

  return (
    <div className="App">
      <RangePicker showTime onChange={onIntervalSelected} />
      <Radio.Group
        onChange={onFilterSelected}
        value={filterBy}
        defaultValue={1}
      >
        <Radio value={1}>Submission Time</Radio>
        <Radio value={2}>Resolution Time</Radio>
      </Radio.Group>
      {interval && (
        <ApolloProvider client={client}>
          <Requests interval={interval} option={filterBy} />
        </ApolloProvider>
      )}
    </div>
  );
};

export default App;
