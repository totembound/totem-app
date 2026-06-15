import React from "react";
import { TotemView } from "./TotemView";
import { Species } from "../../../types/types";
import { useCodexVariants } from "../../../utils/species";

const WolfTotem: React.FC = () => {
    const variants = useCodexVariants(Species.Wolf);
    return <TotemView config={{
      species: Species.Wolf,
      variants
    }}/>
};

export default WolfTotem;
