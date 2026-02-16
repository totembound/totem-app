import React from "react";
import { TotemView } from "./TotemView";
import { Species } from "../../../types/types";


const WoodpeckerTotem: React.FC = () => {
    return <TotemView config={{
      species: Species.Woodpecker,
      variants: []
    }}/>
};

export default WoodpeckerTotem;
