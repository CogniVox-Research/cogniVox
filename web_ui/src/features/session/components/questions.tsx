import type { QuestionState } from "@/lib/session";

const QuestionPage = ({ state }: { state: QuestionState }) => {
  return JSON.stringify(state);
};

export default QuestionPage;
