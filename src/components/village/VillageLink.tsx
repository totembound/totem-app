import React from 'react';
import { Link, LinkProps, useLocation } from 'react-router-dom';
import { withVillagePrefix } from './villagePath';

/**
 * Drop-in replacement for react-router-dom's Link that auto-prefixes the
 * `to` path with /keepers-village when the current route is inside the
 * village trunk. Lets shared content (guides, codex pages, lore) keep its
 * static link arrays without each consumer wiring up useLocation manually.
 *
 * Only string `to` values are rewritten. If `to` is a Path/object or a
 * relative path, it passes through unchanged.
 */
export const VillageLink: React.FC<LinkProps> = ({ to, ...rest }) => {
  const location = useLocation();
  const target = typeof to === 'string' ? withVillagePrefix(location.pathname, to) : to;
  return <Link to={target} {...rest} />;
};

export default VillageLink;
