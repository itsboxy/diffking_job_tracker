import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    font-family: 'Arial', sans-serif;
    background-color: #f4f4f4;
    color: #333;
  }

  h1, h2, h3, h4, h5, h6 {
    margin: 0;
    padding: 0;
  }

  button {
    cursor: pointer;
    border: none;
    border-radius: 4px;
    padding: 10px 15px;
    font-size: 16px;
    transition: background-color 0.3s ease;
  }

  button:hover {
    background-color: #007bff;
    color: white;
  }

  .job-status {
    display: flex;
    justify-content: space-between;
    margin: 10px 0;
  }

  .job-status.complete {
    color: green;
  }

  .job-status.in-progress {
    color: orange;
  }

  .job-status.not-started {
    color: red;
  }
`;

export default GlobalStyle;