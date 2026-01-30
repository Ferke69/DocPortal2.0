import React from 'react';
import { useSessionTimeout } from '../hooks/useSessionTimeout';

const SessionTimeoutWrapper = ({ children }) => {
  useSessionTimeout();
  return <>{children}</>;
};

export default SessionTimeoutWrapper;
