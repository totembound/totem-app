import React from "react";
import { TotemView } from "./TotemView";
import { Species } from "../../../types/types";


const TurtleTotem: React.FC = () => {
    return <TotemView config={{
      species: Species.Turtle,
      variants: []
    }}/>
};

export default TurtleTotem;
