import React from "react";
import { TotemView } from "./TotemView";
import { Species } from "../../../types/types";
import { OWL_TOTEMS } from "../../../config/constants";

const SnakeTotem: React.FC = () => {
    return <TotemView config={{
      species: Species.Snake,
      variants: []
    }}/>
};

export default SnakeTotem;
