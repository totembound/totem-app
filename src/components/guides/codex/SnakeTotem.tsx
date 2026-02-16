import React from "react";
import { TotemView } from "./TotemView";
import { Species } from "../../../types/types";


const SnakeTotem: React.FC = () => {
    return <TotemView config={{
      species: Species.Snake,
      variants: []
    }}/>
};

export default SnakeTotem;
