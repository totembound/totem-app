import React from "react";
import { TotemView } from "./TotemView";
import { Species } from "../../../types/types";
import { OWL_TOTEMS } from "../../../config/constants";

const OwlTotem: React.FC = () => {
    return <TotemView config={{
      species: Species.Owl,
      variants: OWL_TOTEMS
    }}/>
};

export default OwlTotem;
