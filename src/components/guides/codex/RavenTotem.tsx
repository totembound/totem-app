import React from "react";
import { TotemView } from "./TotemView";
import { Species } from "../../../types/types";


const RavenTotem: React.FC = () => {
    return <TotemView config={{
      species: Species.Raven,
      variants: []
    }}/>
};

export default RavenTotem;
