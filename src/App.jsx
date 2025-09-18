import React from 'react'
import VideoProctoring from './components/VideoProctoring'
import styled from 'styled-components'

const AppContainer = styled.div`
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  color: #333;
  margin-bottom: 10px;
`;

const Subtitle = styled.p`
  color: #666;
  font-size: 1.1em;
`;

function App() {
  return (
    <AppContainer>
      <Header>
        <Title>Video Interview Proctoring System</Title>
        <Subtitle>AI-powered focus and object detection</Subtitle>
      </Header>
      <VideoProctoring />
    </AppContainer>
  )
}

export default App
