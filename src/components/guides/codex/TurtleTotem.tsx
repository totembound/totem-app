import React from "react";
import { TotemView } from "./TotemView";
import { Species } from "../../../types/types";
import { useCodexVariants } from "../../../utils/species";

const TurtleTotem: React.FC = () => {
    const variants = useCodexVariants(Species.Turtle);
    return <TotemView config={{
      species: Species.Turtle,
      variants
    }}/>
};

export default TurtleTotem;
