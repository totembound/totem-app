import React from "react";
import { TotemView } from "./TotemView";
import { Species } from "../../../types/types";
import { useCodexVariants } from "../../../utils/species";

const RavenTotem: React.FC = () => {
    const variants = useCodexVariants(Species.Raven);
    return <TotemView config={{
      species: Species.Raven,
      variants
    }}/>
};

export default RavenTotem;
