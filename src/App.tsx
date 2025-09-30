import EnhancedBorderSurveillance from "./components/command";
import ErrorBoundary from "./components/ErrorBounadry";

const App = () => {
  return (
    <div>
      <ErrorBoundary>
        <EnhancedBorderSurveillance />
      </ErrorBoundary>
    </div>
  );
};

export default App;
