import React from "react";
import { TotemView } from "./TotemView";
import { Species } from "../../../types/types";
import { useCodexVariants } from "../../../utils/species";

const WoodpeckerTotem: React.FC = () => {
    const variants = useCodexVariants(Species.Woodpecker);
    return <TotemView config={{
      species: Species.Woodpecker,
      variants
    }}/>
};

export default WoodpeckerTotem;
