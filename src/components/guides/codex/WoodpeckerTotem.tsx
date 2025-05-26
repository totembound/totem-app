import React from "react";
import { TotemView } from "./TotemView";
import { Species } from "../../../types/types";
import { OWL_TOTEMS } from "../../../config/constants";

const WoodpeckerTotem: React.FC = () => {
    return <TotemView config={{
      species: Species.Woodpecker,
      variants: []
    }}/>
};

export default WoodpeckerTotem;
