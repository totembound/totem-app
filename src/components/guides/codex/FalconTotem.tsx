import React from "react";
import { TotemView } from "./TotemView";
import { Species } from "../../../types/types";
import { useCodexVariants } from "../../../utils/species";

const FalconTotem: React.FC = () => {
    const variants = useCodexVariants(Species.Falcon);
    return <TotemView config={{
      species: Species.Falcon,
      variants
    }}/>
};

export default FalconTotem;
