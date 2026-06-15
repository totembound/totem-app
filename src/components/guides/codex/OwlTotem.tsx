import React from "react";
import { TotemView } from "./TotemView";
import { Species } from "../../../types/types";
import { useCodexVariants } from "../../../utils/species";

const OwlTotem: React.FC = () => {
    const variants = useCodexVariants(Species.Owl);
    return <TotemView config={{
      species: Species.Owl,
      variants
    }}/>
};

export default OwlTotem;
