import React from "react";
import { House } from "lucide-react";
import { Button } from "./button";
import { useNavigate } from "react-router-dom";
const BackToHome = () => {
  const navigate = useNavigate();
  return (
    <Button
      variant="outline"
      size="icon"
      className="text-primary flex items-center gap-2 p-0"
      onClick={() => navigate("/")}
    >
      <House />
    </Button>
  );
};

export default BackToHome;
