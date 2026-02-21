import React from "react";
import { TotemView } from "./TotemView";
import { Species } from "../../../types/types";
import { useCodexVariants } from "../../../utils/species";

const BeaverTotem: React.FC = () => {
    const variants = useCodexVariants(Species.Beaver);
    return <TotemView config={{
      species: Species.Beaver,
      variants
    }}/>
};

export default BeaverTotem;
