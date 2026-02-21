import React from "react";
import { TotemView } from "./TotemView";
import { Species } from "../../../types/types";
import { useCodexVariants } from "../../../utils/species";

const DeerTotem: React.FC = () => {
    const variants = useCodexVariants(Species.Deer);
    return <TotemView config={{
      species: Species.Deer,
      variants
    }}/>
};

export default DeerTotem;
