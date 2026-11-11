import type { MarketSpecialtyId } from "@/lib/property-catalog";

/**
 * Explicit photo-by-photo specialty mapping (Rule 9 / HUB & ARTEMIS audit 2026-11-08).
 * Every service trade photo is assigned to the specialty of the trade actually shown in the photo,
 * rather than derived from the service card title.
 */
export const PHOTO_SPECIALTY: Record<string, MarketSpecialtyId> = {
  // Commercial — Roofing
  "/curated/commercial/com_04_2.jpg": "roofing",
  "/curated/commercial/cx_r1.jpg": "roofing",
  "/curated/commercial/com_04_1.jpg": "roofing",
  // Commercial — Exterior / Siding / Masonry
  "/curated/commercial/com_02_2.jpg": "siding",
  "/curated/commercial/cx_o3.jpg": "siding",
  "/curated/hero/com-plaza-stone.jpg": "stone",
  // Commercial — Framing
  "/curated/commercial/com-cfs-stud-framing-3story.jpg": "framing",
  "/curated/magazine/revista_fr_metal_04.jpg": "framing",
  "/curated/hero/com-dusk-steel.jpg": "framing",
  // Commercial — Flooring
  "/curated/commercial/com-lobby-porcelain-tile.jpg": "flooring",
  "/work/flooring_commercial.jpg": "flooring",
  "/curated/commercial/com_03_2.jpg": "flooring",
  // Commercial — Interiors / Drywall
  "/work/drywall_commercial.jpg": "drywall",
  "/curated/commercial/com_03_1.jpg": "drywall",
  "/curated/commercial/cx_i1.jpg": "carpentry",
  // Commercial — Tenant Improvements / Carpentry
  "/curated/commercial/com_01_1.jpg": "carpentry",
  "/curated/commercial/com-retail-fitout-shelving.jpg": "carpentry",
  "/curated/commercial/cx_y3.jpg": "carpentry",
  // Commercial — Site Preparation -> Concrete
  "/curated/magazine/revista_ex_sp_demo.jpg": "concrete",
  "/curated/magazine/revista_ex_ex_mass.jpg": "concrete",
  "/curated/magazine/revista_ex_ex_found.jpg": "concrete",
  // Commercial — Foundations & Concrete
  "/curated/commercial/com-slab-stem-walls.jpg": "concrete",
  "/curated/commercial/com-foundation-pad-rebar.jpg": "concrete",
  "/curated/commercial/com-warehouse-industrial-floor.jpg": "concrete",
  // Commercial — Property Programs
  "/curated/commercial/com-office-park-exterior-program.jpg": "siding",
  "/curated/commercial/com-retail-strip-envelope-rehab.jpg": "siding",
  "/curated/commercial/com-office-corridor-turnover.jpg": "drywall",
  // Commercial — Restoration
  "/curated/capabilities/fire-steel-ibeam.jpg": "framing",
  "/curated/pairs/div04_03_antes.jpg": "roofing",
  "/curated/commercial/com-water-mitigation-office.jpg": "drywall",

  // Residential (Single-Family, Multifamily, Townhomes) — Roofing
  "/curated/pairs/div02_02_despues.jpg": "roofing",
  "/curated/residential/div04_06_despues.jpg": "roofing",
  "/curated/properties/mkt-mf-roofing.jpg": "roofing",
  "/curated/capabilities/mf-tpo-capex.jpg": "roofing",
  "/work/roofing_multifamily.jpg": "roofing",
  "/curated/properties/mkt-twn-roofing-siding.jpg": "roofing",
  "/curated/properties/townhouse-03-brownstone-mansard-row.jpg": "roofing",
  "/curated/properties/townhouse-05-stepped-grade-rowhouses.jpg": "roofing",

  // Residential — Siding / Windows & Doors / Masonry
  "/curated/residential/s1.jpg": "siding",
  "/curated/residential/div01_04_despues.jpg": "siding",
  "/curated/residential/div02_06_despues.jpg": "siding",
  "/curated/properties/duplex-01-brick-cedar-asymmetric.jpg": "siding",
  "/curated/properties/duplex-05-minneapolis-buffbrick-dormer.jpg": "siding",
  "/work/siding_multifamily.jpg": "siding",
  "/curated/properties/townhouse-01-brick-limestone-row.jpg": "stone",
  "/curated/properties/townhouse-02-corner-masonry-cedar-row.jpg": "siding",
  "/work/siding_townhomes.jpg": "siding",

  // Residential — Framing
  "/curated/pairs/div01_01_despues.jpg": "framing",
  "/curated/residential/div01_06_despues.jpg": "framing",
  "/curated/magazine/revista_fr_wood_05.jpg": "framing",
  "/curated/properties/mkt-mf-framing.jpg": "framing",
  "/curated/properties/mkt-mf-framing-trusses.jpg": "framing",
  "/curated/properties/mkt-twn-framing-row.jpg": "framing",
  "/curated/properties/mkt-twn-framing-partywall.jpg": "framing",
  "/curated/properties/mkt-twn-framing-rooftop.jpg": "framing",

  // Residential — Drywall & Painting
  "/curated/residential/sf-drywall-level5-living.jpg": "drywall",
  "/curated/magazine/revista_in_05_a.jpg": "drywall",
  "/curated/residential/sf-interior-painting-bedroom.jpg": "drywall",
  "/curated/properties/mkt-mf-drywall.jpg": "drywall",
  "/curated/properties/interior-duplex-brick-living.jpg": "drywall",
  "/work/drywall_multifamily.jpg": "drywall",
  "/curated/properties/mkt-twn-drywall-gallery.jpg": "drywall",
  "/curated/properties/mkt-twn-framing-drywall.jpg": "drywall",
  "/work/painting_townhomes.jpg": "drywall",

  // Residential — Carpentry
  "/curated/pairs/div03_02_despues.jpg": "carpentry",
  "/curated/pairs/div01_03_despues.jpg": "carpentry",
  "/curated/residential/div01_05_despues.jpg": "carpentry",
  "/curated/properties/mkt-mf-carpentry-lounge.jpg": "carpentry",
  "/curated/properties/interior-duplex-brick-kitchen.jpg": "carpentry",
  "/curated/properties/interior-limestone-modern-kitchen.jpg": "carpentry",
  "/curated/properties/mkt-twn-carpentry-library.jpg": "carpentry",
  "/curated/properties/interior-townhouse-parlor-kitchen.jpg": "carpentry",
  "/curated/properties/mkt-twn-flooring-stairtreads.jpg": "flooring",

  // Residential — Foundations, Concrete & Stone
  "/curated/residential/div01_07_despues.jpg": "concrete",
  "/curated/pairs/div02_03_despues.jpg": "stone",
  "/curated/residential/sf-concrete-driveway-front-walk.jpg": "concrete",
  "/curated/properties/mkt-mf-concrete-podium.jpg": "concrete",
  "/curated/properties/mkt-mf-stone-courtyard.jpg": "stone",
  "/curated/properties/mkt-mf-flooring-concrete.jpg": "concrete",
  "/curated/properties/mkt-twn-concrete-stone.jpg": "concrete",
  "/curated/properties/mkt-twn-concrete-drive.jpg": "concrete",
  "/curated/properties/mkt-twn-stone-gardenwall.jpg": "stone",

  // Residential — Restoration (assigned by visible trade)
  "/curated/capabilities/fire-wood-framing.jpg": "framing",
  "/curated/residential/sf-drywall-water-repair-bedroom.jpg": "drywall",
  "/curated/capabilities/mit-taped-drywall.jpg": "drywall",
  "/curated/pairs/div03_04_antes.jpg": "drywall",
  "/curated/residential/sf-drywall-flood-basement.jpg": "drywall",
  "/curated/residential/sf-finished-basement-office.jpg": "flooring",

  // Residential — Renovation / Remodeling (assigned by visible trade)
  "/curated/residential/sf-finished-basement-lounge.jpg": "flooring",
  "/curated/residential/div03_03_despues.jpg": "flooring",
  "/curated/residential/div01_08_despues.jpg": "carpentry",
  "/curated/properties/duplex-04-evanston-corner-twoflat.jpg": "siding",
  "/curated/properties/interior-limestone-modern-living.jpg": "flooring",
  "/curated/properties/interior-duplex-rear-patio-courtyard.jpg": "concrete",
  "/curated/properties/townhouse-04-chicago-endunit-brick.jpg": "stone",
  "/curated/properties/interior-townhouse-living-bay.jpg": "flooring",
  "/curated/properties/interior-townhouse-rooftop-terrace.jpg": "carpentry",

  // Work-in-progress field photos — Single-Family
  "/curated/obra/single-family/sf-roofing-tearoff.jpg": "roofing",
  "/curated/obra/single-family/carpentry-1.jpg": "carpentry",
  "/curated/obra/single-family/concrete-1.jpg": "concrete",
  "/curated/obra/single-family/flooring-1.jpg": "flooring",
  "/curated/obra/single-family/stone-1.jpg": "stone",
  "/curated/obra/single-family/stone-2.jpg": "stone",

  // Work-in-progress field photos — Multifamily
  "/curated/obra/multifamily/mf-roofing-tpo.jpg": "roofing",
  "/curated/obra/multifamily/roofing-1.jpg": "roofing",
  "/curated/obra/multifamily/siding-1.jpg": "siding",
  "/curated/obra/multifamily/siding-2.jpg": "siding",
  "/curated/obra/multifamily/carpentry-1.jpg": "carpentry",
  "/curated/obra/multifamily/carpentry-2.jpg": "carpentry",
  "/curated/obra/multifamily/concrete-1.jpg": "concrete",
  "/curated/obra/multifamily/concrete-2.jpg": "concrete",
  "/curated/obra/multifamily/flooring-1.jpg": "flooring",
  "/curated/obra/multifamily/flooring-2.jpg": "flooring",
  "/curated/obra/multifamily/stone-1.jpg": "stone",
  "/curated/obra/multifamily/stone-2.jpg": "stone",

  // Work-in-progress field photos — Townhomes
  "/curated/obra/townhomes/tw-roofing-standing-seam.jpg": "roofing",
  "/curated/obra/townhomes/roofing-1.jpg": "roofing",
  "/curated/obra/townhomes/siding-1.jpg": "siding",
  "/curated/obra/townhomes/siding-2.jpg": "siding",
  "/curated/obra/townhomes/drywall-1.jpg": "drywall",
  "/curated/obra/townhomes/carpentry-1.jpg": "carpentry",
  "/curated/obra/townhomes/carpentry-2.jpg": "carpentry",
  "/curated/obra/townhomes/concrete-1.jpg": "concrete",
  "/curated/obra/townhomes/concrete-2.jpg": "concrete",
  "/curated/obra/townhomes/flooring-1.jpg": "flooring",
  "/curated/obra/townhomes/flooring-2.jpg": "flooring",
  "/curated/obra/townhomes/stone-1.jpg": "stone",
  "/curated/obra/townhomes/stone-2.jpg": "stone",

  // Work-in-progress field photos — Commercial
  "/curated/obra/commercial/com-roofing-teardown.jpg": "roofing",
  "/curated/obra/commercial/roofing-1.jpg": "roofing",
  "/curated/obra/commercial/stone-1.jpg": "stone",
  "/curated/obra/commercial/stone-2.jpg": "stone",
  "/curated/obra/commercial/flooring-1.jpg": "flooring",
  "/curated/obra/commercial/flooring-2.jpg": "flooring",
  "/curated/obra/commercial/carpentry-1.jpg": "carpentry",
  "/curated/obra/commercial/carpentry-2.jpg": "carpentry",

  // Same-building pilot & Wave 2 sequences — All 8 Single-Family Specialties
  "/curated/obra/single-family/sf-roofing-estate-prep.jpg": "roofing",
  "/curated/obra/single-family/sf-roofing-estate-install.jpg": "roofing",
  "/curated/obra/single-family/sf-flooring-foyer-prep.jpg": "flooring",
  "/curated/obra/single-family/sf-flooring-foyer-install.jpg": "flooring",
  "/curated/obra/single-family/sf-siding-seq1-prep.jpg": "siding",
  "/curated/obra/single-family/sf-siding-seq1-install.jpg": "siding",
  "/curated/obra/single-family/sf-framing-seq1-prep.jpg": "framing",
  "/curated/obra/single-family/sf-framing-seq1-install.jpg": "framing",
  "/curated/obra/single-family/sf-drywall-seq1-prep.jpg": "drywall",
  "/curated/obra/single-family/sf-drywall-seq1-install.jpg": "drywall",
  "/curated/properties/sf-drywall-seq1-finish.jpg": "drywall",
  "/curated/obra/single-family/sf-concrete-seq1-prep.jpg": "concrete",
  "/curated/obra/single-family/sf-concrete-seq1-install.jpg": "concrete",
  "/curated/obra/single-family/sf-stone-seq1-prep.jpg": "stone",
  "/curated/obra/single-family/sf-stone-seq1-install.jpg": "stone",
  "/curated/obra/single-family/sf-carpentry-seq1-prep.jpg": "carpentry",
  "/curated/obra/single-family/sf-carpentry-seq1-install.jpg": "carpentry",

  // Same-building Wave 3 sequences — All 8 Multifamily Specialties
  "/curated/obra/multifamily/mf-roofing-seq1-prep.jpg": "roofing",
  "/curated/obra/multifamily/mf-roofing-seq1-install.jpg": "roofing",
  "/curated/obra/multifamily/mf-siding-seq1-prep.jpg": "siding",
  "/curated/obra/multifamily/mf-siding-seq1-install.jpg": "siding",
  "/curated/obra/multifamily/mf-framing-seq1-prep.jpg": "framing",
  "/curated/obra/multifamily/mf-framing-seq1-install.jpg": "framing",
  "/curated/obra/multifamily/mf-drywall-seq1-prep.jpg": "drywall",
  "/curated/obra/multifamily/mf-drywall-seq1-install.jpg": "drywall",
  "/curated/obra/multifamily/mf-flooring-seq1-prep.jpg": "flooring",
  "/curated/obra/multifamily/mf-flooring-seq1-install.jpg": "flooring",
  "/curated/obra/multifamily/mf-concrete-seq1-prep.jpg": "concrete",
  "/curated/obra/multifamily/mf-concrete-seq1-install.jpg": "concrete",
  "/curated/obra/multifamily/mf-stone-seq1-prep.jpg": "stone",
  "/curated/obra/multifamily/mf-stone-seq1-install.jpg": "stone",
  "/curated/obra/multifamily/mf-carpentry-seq1-prep.jpg": "carpentry",
  "/curated/obra/multifamily/mf-carpentry-seq1-install.jpg": "carpentry",

  // Same-building Wave 4 sequences — All 8 Townhomes Specialties
  "/curated/obra/townhomes/tw-roofing-seq1-prep.jpg": "roofing",
  "/curated/obra/townhomes/tw-roofing-seq1-install.jpg": "roofing",
  "/curated/properties/tw-roofing-seq1-finish.jpg": "roofing",
  "/curated/obra/townhomes/tw-siding-seq1-prep.jpg": "siding",
  "/curated/obra/townhomes/tw-siding-seq1-install.jpg": "siding",
  "/curated/obra/townhomes/tw-framing-seq1-prep.jpg": "framing",
  "/curated/obra/townhomes/tw-framing-seq1-install.jpg": "framing",
  "/curated/obra/townhomes/tw-drywall-seq1-prep.jpg": "drywall",
  "/curated/obra/townhomes/tw-drywall-seq1-install.jpg": "drywall",
  "/curated/obra/townhomes/tw-flooring-seq1-prep.jpg": "flooring",
  "/curated/obra/townhomes/tw-flooring-seq1-install.jpg": "flooring",
  "/curated/obra/townhomes/tw-concrete-seq1-prep.jpg": "concrete",
  "/curated/obra/townhomes/tw-concrete-seq1-install.jpg": "concrete",
  "/curated/obra/townhomes/tw-stone-seq1-prep.jpg": "stone",
  "/curated/obra/townhomes/tw-stone-seq1-install.jpg": "stone",
  "/curated/obra/townhomes/tw-carpentry-seq1-prep.jpg": "carpentry",
  "/curated/obra/townhomes/tw-carpentry-seq1-install.jpg": "carpentry",

  // Same-building Wave 5 sequences — All 8 Commercial Specialties
  "/curated/obra/commercial/com-roofing-seq1-prep.jpg": "roofing",
  "/curated/obra/commercial/com-roofing-seq1-install.jpg": "roofing",
  "/curated/obra/commercial/com-siding-seq1-prep.jpg": "siding",
  "/curated/obra/commercial/com-siding-seq1-install.jpg": "siding",
  "/curated/properties/com-siding-seq1-finish.jpg": "siding",
  "/curated/obra/commercial/com-framing-seq1-prep.jpg": "framing",
  "/curated/obra/commercial/com-framing-seq1-install.jpg": "framing",
  "/curated/properties/com-framing-seq1-finish.jpg": "framing",
  "/curated/obra/commercial/com-drywall-seq1-prep.jpg": "drywall",
  "/curated/obra/commercial/com-drywall-seq1-install.jpg": "drywall",
  "/curated/obra/commercial/com-flooring-seq1-prep.jpg": "flooring",
  "/curated/obra/commercial/com-flooring-seq1-install.jpg": "flooring",
  "/curated/obra/commercial/com-concrete-seq1-prep.jpg": "concrete",
  "/curated/obra/commercial/com-concrete-seq1-install.jpg": "concrete",
  "/curated/obra/commercial/com-stone-seq1-prep.jpg": "stone",
  "/curated/obra/commercial/com-stone-seq1-install.jpg": "stone",
  "/curated/obra/commercial/com-carpentry-seq1-prep.jpg": "carpentry",
  "/curated/obra/commercial/com-carpentry-seq1-install.jpg": "carpentry",
};

export type SpecialtyConstructionStage = "preparation" | "installation" | "finished";
export type ConstructionStage = SpecialtyConstructionStage;

export const CONSTRUCTION_STAGE_ORDER: Record<SpecialtyConstructionStage, number> = {
  preparation: 0,
  installation: 1,
  finished: 2,
};

export const STAGE_BADGE_LABELS: Record<SpecialtyConstructionStage, string> = {
  preparation: "Stage 1 · Preparation",
  installation: "Stage 2 · Installation",
  finished: "Stage 3 · Finished",
};

/**
 * Explicit construction stage mapping for all 32 division specialty galleries.
 * Prioritizes validated multi-perspective Tayco sequences (same property shown across angles/stages)
 * while maintaining strict Stage 1 (Preparation) -> Stage 2 (Installation) -> Stage 3 (Finished) ordering.
 */
export const PHOTO_CONSTRUCTION_STAGE: Record<string, SpecialtyConstructionStage> = {
  // Single-Family (SFH)
  // Roofing
  "/curated/obra/single-family/sf-roofing-estate-prep.jpg": "preparation",
  "/curated/obra/single-family/sf-roofing-estate-install.jpg": "installation",
  "/curated/obra/single-family/sf-roofing-tearoff.jpg": "preparation",
  "/curated/residential/div04_06_despues.jpg": "installation",
  "/curated/pairs/div02_02_despues.jpg": "finished",
  "/curated/hero/res-estate-roofing.jpg": "finished",
  "/curated/hero/res-farmhouse-metal.jpg": "finished",

  // Siding (Same home sheathing/wrap -> Same home horizontal lap install -> Same home finished)
  "/curated/obra/single-family/sf-siding-seq1-prep.jpg": "preparation",
  "/curated/obra/single-family/sf-siding-seq1-install.jpg": "installation",
  "/curated/capabilities/reo-siding-wrap.jpg": "preparation",
  "/curated/residential/div01_04_despues.jpg": "installation",
  "/curated/residential/div02_06_despues.jpg": "installation",
  "/curated/residential/s1.jpg": "finished",
  "/curated/hero/res-cedar-deck-home.jpg": "finished",

  // Framing (Same lot stem-wall/subfloor -> Same lot stud walls -> Completed wood structural shell)
  "/curated/obra/single-family/sf-framing-seq1-prep.jpg": "preparation",
  "/curated/obra/single-family/sf-framing-seq1-install.jpg": "installation",
  "/curated/residential/sf-i-joist-osb-subfloor.jpg": "preparation",
  "/curated/properties/mkt-sfh-framing.jpg": "finished",
  "/curated/capabilities/fire-wood-framing.jpg": "installation",
  "/curated/pairs/div01_01_despues.jpg": "installation",
  "/curated/residential/div01_06_despues.jpg": "installation",
  "/curated/magazine/revista_fr_wood_05.jpg": "finished",

  // Drywall (Same room stud/rough-in -> Same room taped gypsum -> Same room Level-5 coffered hearth)
  "/curated/obra/single-family/sf-drywall-seq1-prep.jpg": "preparation",
  "/curated/obra/single-family/sf-drywall-seq1-install.jpg": "installation",
  "/curated/properties/sf-drywall-seq1-finish.jpg": "finished",
  "/curated/pairs/div03_04_antes.jpg": "preparation",
  "/curated/residential/sf-drywall-flood-basement.jpg": "preparation",
  "/curated/residential/sf-drywall-water-repair-bedroom.jpg": "installation",
  "/curated/residential/sf-interior-painting-bedroom.jpg": "installation",
  "/curated/magazine/revista_in_05_a.jpg": "installation",
  "/curated/properties/mkt-sfh-drywall-flooring.jpg": "finished",
  "/curated/hero/res-coffered-hearth.jpg": "finished",
  "/curated/residential/sf-drywall-level5-living.jpg": "finished",

  // Flooring (Same foyer underlayment prep -> Same foyer oak plank install -> Same foyer staircase finished)
  "/curated/obra/single-family/sf-flooring-foyer-prep.jpg": "preparation",
  "/curated/obra/single-family/sf-flooring-foyer-install.jpg": "installation",
  "/curated/capabilities/mit-hardwood-underlay.jpg": "preparation",
  "/curated/obra/single-family/flooring-1.jpg": "installation",
  "/curated/properties/interior-custom-foyer-oak-staircase.jpg": "finished",
  "/curated/properties/interior-primary-suite-oak-bedroom.jpg": "finished",
  "/curated/residential/sf-finished-basement-lounge.jpg": "finished",
  "/curated/residential/div03_03_despues.jpg": "finished",
  "/curated/residential/sf-finished-basement-office.jpg": "finished",

  // Concrete (Same walkout compacted base & formwork -> Same walkout fresh pour -> Same walkout cured patio)
  "/curated/obra/single-family/sf-concrete-seq1-prep.jpg": "preparation",
  "/curated/obra/single-family/sf-concrete-seq1-install.jpg": "installation",
  "/curated/obra/single-family/concrete-1.jpg": "preparation",
  "/curated/residential/div01_07_despues.jpg": "installation",
  "/curated/residential/sf-concrete-apron-curb-sidewalk.jpg": "finished",
  "/curated/residential/sf-concrete-driveway-front-walk.jpg": "finished",
  "/curated/properties/mkt-sfh-concrete.jpg": "finished",
  "/curated/residential/sf-walkout-concrete-patio.jpg": "finished",

  // Stone (Same great room lath & scratch coat -> Same great room stone courses -> Same great room hearth)
  "/curated/obra/single-family/sf-stone-seq1-prep.jpg": "preparation",
  "/curated/obra/single-family/sf-stone-seq1-install.jpg": "installation",
  "/curated/obra/single-family/stone-2.jpg": "preparation",
  "/curated/obra/single-family/stone-1.jpg": "installation",
  "/curated/properties/interior-singlefamily-greatroom-stone.jpg": "finished",
  "/curated/properties/mkt-sfh-stone-exterior.jpg": "finished",
  "/curated/properties/interior-limestone-modern-living.jpg": "finished",
  "/curated/pairs/div02_03_despues.jpg": "finished",

  // Carpentry (Same pantry layout cleats & base leveling -> Same pantry walnut boxes hung -> Same pantry finished)
  "/curated/obra/single-family/sf-carpentry-seq1-prep.jpg": "preparation",
  "/curated/obra/single-family/sf-carpentry-seq1-install.jpg": "installation",
  "/curated/obra/single-family/carpentry-1.jpg": "preparation",
  "/curated/residential/div01_05_despues.jpg": "installation",
  "/curated/pairs/div03_02_despues.jpg": "finished",
  "/curated/properties/interior-primary-spa-bath-walkin.jpg": "finished",
  "/curated/hero/res-navy-kitchen.jpg": "finished",
  "/curated/pairs/div01_03_despues.jpg": "finished",
  "/curated/residential/div01_08_despues.jpg": "finished",

  // Multifamily (MF)
  // Roofing
  "/curated/obra/multifamily/mf-roofing-seq1-prep.jpg": "preparation",
  "/curated/obra/multifamily/mf-roofing-seq1-install.jpg": "installation",
  "/curated/obra/multifamily/roofing-1.jpg": "preparation",
  "/curated/obra/multifamily/mf-roofing-tpo.jpg": "installation",
  "/work/roofing_multifamily.jpg": "installation",
  "/curated/properties/mkt-mf-roofing.jpg": "finished",
  "/curated/properties/duplex-05-minneapolis-buffbrick-dormer.jpg": "finished",
  "/curated/capabilities/mf-tpo-capex.jpg": "finished",

  // Siding (4-story scaffold cladding -> balcony siding install -> finished multifamily elevations)
  "/curated/obra/multifamily/mf-siding-seq1-prep.jpg": "preparation",
  "/curated/obra/multifamily/mf-siding-seq1-install.jpg": "installation",
  "/curated/obra/multifamily/siding-1.jpg": "preparation",
  "/curated/obra/multifamily/siding-2.jpg": "installation",
  "/work/siding_multifamily.jpg": "installation",
  "/curated/properties/duplex-01-brick-cedar-asymmetric.jpg": "finished",
  "/curated/properties/duplex-03-columbus-lplan-brick.jpg": "finished",
  "/curated/capabilities/mf-apartments-4story.jpg": "finished",
  "/curated/properties/duplex-04-evanston-corner-twoflat.jpg": "finished",

  // Framing (Open-web floor trusses -> Exterior timber frame -> Completed 4-story wood structure)
  "/curated/obra/multifamily/mf-framing-seq1-prep.jpg": "preparation",
  "/curated/obra/multifamily/mf-framing-seq1-install.jpg": "installation",
  "/curated/properties/mkt-mf-framing-trusses.jpg": "preparation",
  "/curated/properties/mkt-mf-framing.jpg": "installation",
  "/curated/commercial/cx_f2.jpg": "finished",

  // Drywall (Taped drywall -> Multifamily corridor taping & soffit -> Same corridor finished with ceiling & lighting)
  "/curated/obra/multifamily/mf-drywall-seq1-prep.jpg": "preparation",
  "/curated/obra/multifamily/mf-drywall-seq1-install.jpg": "installation",
  "/curated/capabilities/mit-taped-drywall.jpg": "preparation",
  "/work/drywall_multifamily.jpg": "installation",
  "/curated/properties/mkt-mf-drywall.jpg": "finished",
  "/curated/capabilities/res-basement-media.jpg": "finished",
  "/curated/properties/interior-duplex-brick-living.jpg": "finished",

  // Flooring
  "/curated/obra/multifamily/mf-flooring-seq1-prep.jpg": "preparation",
  "/curated/obra/multifamily/mf-flooring-seq1-install.jpg": "installation",
  "/curated/obra/multifamily/flooring-1.jpg": "preparation",
  "/curated/obra/multifamily/flooring-2.jpg": "installation",
  "/curated/properties/mkt-mf-flooring-concrete.jpg": "finished",
  "/curated/properties/interior-limestone-modern-kitchen.jpg": "finished",

  // Concrete
  "/curated/obra/multifamily/mf-concrete-seq1-prep.jpg": "preparation",
  "/curated/obra/multifamily/mf-concrete-seq1-install.jpg": "installation",
  "/curated/obra/multifamily/concrete-1.jpg": "preparation",
  "/curated/obra/multifamily/concrete-2.jpg": "installation",
  "/curated/properties/interior-duplex-rear-patio-courtyard.jpg": "finished",
  "/curated/properties/mkt-mf-concrete-podium.jpg": "finished",
  "/curated/properties/duplex-06-austin-limestone-infill.jpg": "finished",

  // Stone
  "/curated/obra/multifamily/mf-stone-seq1-prep.jpg": "preparation",
  "/curated/obra/multifamily/mf-stone-seq1-install.jpg": "installation",
  "/curated/obra/multifamily/stone-1.jpg": "preparation",
  "/curated/obra/multifamily/stone-2.jpg": "installation",
  "/curated/properties/duplex-02-limestone-stucco-asymmetric.jpg": "finished",
  "/curated/properties/mkt-mf-stone-courtyard.jpg": "finished",

  // Carpentry
  "/curated/obra/multifamily/mf-carpentry-seq1-prep.jpg": "preparation",
  "/curated/obra/multifamily/mf-carpentry-seq1-install.jpg": "installation",
  "/curated/obra/multifamily/carpentry-1.jpg": "preparation",
  "/curated/obra/multifamily/carpentry-2.jpg": "installation",
  "/curated/properties/interior-duplex-brick-kitchen.jpg": "finished",
  "/curated/properties/mkt-mf-carpentry-lounge.jpg": "finished",
  "/curated/properties/mkt-mf-stone-entry.jpg": "finished",

  // Townhomes (TWN)
  // Roofing
  "/curated/obra/townhomes/tw-roofing-seq1-prep.jpg": "preparation",
  "/curated/obra/townhomes/tw-roofing-seq1-install.jpg": "installation",
  "/curated/properties/tw-roofing-seq1-finish.jpg": "finished",
  "/curated/obra/townhomes/tw-roofing-standing-seam.jpg": "preparation",
  "/curated/obra/townhomes/roofing-1.jpg": "installation",
  "/curated/properties/mkt-twn-roofing-siding.jpg": "finished",
  "/curated/properties/townhouse-03-brownstone-mansard-row.jpg": "finished",
  "/curated/properties/townhouse-05-stepped-grade-rowhouses.jpg": "finished",

  // Siding
  "/curated/obra/townhomes/tw-siding-seq1-prep.jpg": "preparation",
  "/curated/obra/townhomes/tw-siding-seq1-install.jpg": "installation",
  "/curated/obra/townhomes/siding-1.jpg": "preparation",
  "/curated/obra/townhomes/siding-2.jpg": "installation",
  "/work/siding_townhomes.jpg": "installation",
  "/curated/capabilities/mf-townhomes-row.jpg": "finished",
  "/curated/properties/townhouse-02-corner-masonry-cedar-row.jpg": "finished",
  "/curated/properties/townhouse-04-chicago-endunit-brick.jpg": "finished",

  // Framing (Party-wall & floor trusses -> 3-story row wood frame -> Penthouse rooftop framing)
  "/curated/obra/townhomes/tw-framing-seq1-prep.jpg": "preparation",
  "/curated/obra/townhomes/tw-framing-seq1-install.jpg": "installation",
  "/curated/properties/mkt-twn-framing-partywall.jpg": "preparation",
  "/curated/properties/mkt-twn-framing-row.jpg": "installation",
  "/curated/properties/mkt-twn-framing-rooftop.jpg": "finished",

  // Drywall (Taped 3-window bay parlor -> Stairwell drywall & cove -> Same bay parlor & stairwell gallery finished)
  "/curated/obra/townhomes/tw-drywall-seq1-prep.jpg": "preparation",
  "/curated/obra/townhomes/tw-drywall-seq1-install.jpg": "installation",
  "/curated/obra/townhomes/drywall-1.jpg": "preparation",
  "/curated/properties/mkt-twn-framing-drywall.jpg": "installation",
  "/work/painting_townhomes.jpg": "installation",
  "/curated/properties/interior-townhouse-living-bay.jpg": "finished",
  "/curated/properties/mkt-twn-drywall-gallery.jpg": "finished",

  // Flooring
  "/curated/obra/townhomes/tw-flooring-seq1-prep.jpg": "preparation",
  "/curated/obra/townhomes/tw-flooring-seq1-install.jpg": "installation",
  "/curated/obra/townhomes/flooring-1.jpg": "preparation",
  "/curated/obra/townhomes/flooring-2.jpg": "installation",
  "/curated/properties/mkt-twn-flooring-herringbone.jpg": "finished",
  "/curated/properties/mkt-twn-flooring-stairtreads.jpg": "finished",
  "/curated/properties/mkt-twn-stone-hearth.jpg": "finished",

  // Concrete
  "/curated/obra/townhomes/tw-concrete-seq1-prep.jpg": "preparation",
  "/curated/obra/townhomes/tw-concrete-seq1-install.jpg": "installation",
  "/curated/obra/townhomes/concrete-1.jpg": "preparation",
  "/curated/obra/townhomes/concrete-2.jpg": "installation",
  "/curated/properties/mkt-twn-concrete-stone.jpg": "finished",
  "/curated/properties/mkt-twn-concrete-drive.jpg": "finished",

  // Stone
  "/curated/obra/townhomes/tw-stone-seq1-prep.jpg": "preparation",
  "/curated/obra/townhomes/tw-stone-seq1-install.jpg": "installation",
  "/curated/obra/townhomes/stone-1.jpg": "preparation",
  "/curated/obra/townhomes/stone-2.jpg": "installation",
  "/curated/properties/townhouse-01-brick-limestone-row.jpg": "finished",
  "/curated/properties/mkt-twn-stone-gardenwall.jpg": "finished",

  // Carpentry
  "/curated/obra/townhomes/tw-carpentry-seq1-prep.jpg": "preparation",
  "/curated/obra/townhomes/tw-carpentry-seq1-install.jpg": "installation",
  "/curated/obra/townhomes/carpentry-1.jpg": "preparation",
  "/curated/obra/townhomes/carpentry-2.jpg": "installation",
  "/curated/properties/mkt-twn-carpentry-library.jpg": "finished",
  "/curated/properties/mkt-twn-carpentry-pergola.jpg": "finished",
  "/curated/properties/interior-townhouse-parlor-kitchen.jpg": "finished",
  "/curated/properties/interior-townhouse-rooftop-terrace.jpg": "finished",

  // Commercial (COM)
  // Roofing
  "/curated/obra/commercial/com-roofing-seq1-prep.jpg": "preparation",
  "/curated/obra/commercial/com-roofing-seq1-install.jpg": "installation",
  "/curated/obra/commercial/com-roofing-teardown.jpg": "preparation",
  "/curated/pairs/div04_03_antes.jpg": "preparation",
  "/curated/obra/commercial/roofing-1.jpg": "installation",
  "/curated/commercial/com_04_2.jpg": "installation",
  "/curated/properties/mkt-com-roofing-tpo.jpg": "finished",
  "/curated/properties/mkt-com-roofing-greenroof.jpg": "finished",
  "/curated/commercial/com-epdm-parapet-roof.jpg": "finished",
  "/curated/commercial/cx_r1.jpg": "finished",
  "/curated/commercial/com_04_1.jpg": "finished",

  // Siding
  "/curated/obra/commercial/com-siding-seq1-prep.jpg": "preparation",
  "/curated/obra/commercial/com-siding-seq1-install.jpg": "installation",
  "/curated/properties/com-siding-seq1-finish.jpg": "finished",
  "/curated/commercial/com_02_2.jpg": "preparation",
  "/curated/commercial/com-retail-strip-envelope-rehab.jpg": "installation",
  "/curated/commercial/com-office-park-exterior-program.jpg": "installation",
  "/curated/commercial/cx_o3.jpg": "finished",
  "/curated/hero/com-dusk-steel.jpg": "finished",
  "/curated/hero/com-hq-sunset.jpg": "finished",

  // Framing
  "/curated/obra/commercial/com-framing-seq1-prep.jpg": "preparation",
  "/curated/obra/commercial/com-framing-seq1-install.jpg": "installation",
  "/curated/properties/com-framing-seq1-finish.jpg": "finished",
  "/curated/capabilities/fire-steel-ibeam.jpg": "preparation",
  "/curated/commercial/com-cfs-stud-framing-3story.jpg": "installation",
  "/curated/magazine/revista_fr_metal_04.jpg": "installation",
  "/curated/commercial/cx_x3.jpg": "finished",
  "/curated/hero/com-framing-atrium.jpg": "finished",

  // Drywall
  "/curated/obra/commercial/com-drywall-seq1-prep.jpg": "preparation",
  "/curated/obra/commercial/com-drywall-seq1-install.jpg": "installation",
  "/curated/commercial/com-water-mitigation-office.jpg": "preparation",
  "/work/drywall_commercial.jpg": "installation",
  "/curated/commercial/com_03_1.jpg": "installation",
  "/curated/properties/mkt-com-drywall-ceilings.jpg": "finished",
  "/curated/commercial/cx_i2.jpg": "finished",
  "/curated/capabilities/com-retail-led.jpg": "finished",
  "/curated/commercial/com-office-corridor-turnover.jpg": "finished",

  // Flooring
  "/curated/obra/commercial/com-flooring-seq1-prep.jpg": "preparation",
  "/curated/obra/commercial/com-flooring-seq1-install.jpg": "installation",
  "/curated/obra/commercial/flooring-1.jpg": "preparation",
  "/curated/obra/commercial/flooring-2.jpg": "installation",
  "/work/flooring_commercial.jpg": "installation",
  "/curated/hero/com-lobby-limestone.jpg": "finished",
  "/curated/commercial/com-polished-concrete-corridor.jpg": "finished",
  "/curated/hero/com-reception-walnut.jpg": "finished",
  "/curated/commercial/com-lobby-porcelain-tile.jpg": "finished",
  "/curated/commercial/com_03_2.jpg": "finished",

  // Concrete
  "/curated/obra/commercial/com-concrete-seq1-prep.jpg": "preparation",
  "/curated/obra/commercial/com-concrete-seq1-install.jpg": "installation",
  "/curated/commercial/com-foundation-pad-rebar.jpg": "preparation",
  "/curated/magazine/revista_ex_sp_demo.jpg": "preparation",
  "/curated/magazine/revista_ex_ex_mass.jpg": "preparation",
  "/curated/magazine/revista_ex_ex_found.jpg": "preparation",
  "/curated/commercial/com-slab-stem-walls.jpg": "installation",
  "/curated/properties/mkt-com-concrete-stone.jpg": "finished",
  "/curated/properties/mkt-com-concrete-tiltup.jpg": "finished",
  "/curated/commercial/com-parking-apron-ada-v2.jpg": "finished",
  "/curated/commercial/com-warehouse-industrial-floor.jpg": "finished",

  // Stone
  "/curated/obra/commercial/com-stone-seq1-prep.jpg": "preparation",
  "/curated/obra/commercial/com-stone-seq1-install.jpg": "installation",
  "/curated/obra/commercial/stone-1.jpg": "preparation",
  "/curated/obra/commercial/stone-2.jpg": "installation",
  "/curated/hero/com-plaza-stone.jpg": "finished",
  "/curated/properties/mkt-com-stone-masonry.jpg": "finished",
  "/curated/properties/mkt-com-stone-colonnade.jpg": "finished",

  // Carpentry
  "/curated/obra/commercial/com-carpentry-seq1-prep.jpg": "preparation",
  "/curated/obra/commercial/com-carpentry-seq1-install.jpg": "installation",
  "/curated/obra/commercial/carpentry-1.jpg": "preparation",
  "/curated/obra/commercial/carpentry-2.jpg": "installation",
  "/curated/properties/interior-commercial-boardroom-atrium.jpg": "finished",
  "/curated/properties/interior-commercial-executive-lounge-terrace.jpg": "finished",
  "/curated/capabilities/com-boardroom.jpg": "finished",
  "/curated/commercial/cx_i1.jpg": "finished",
  "/curated/commercial/com_01_1.jpg": "finished",
  "/curated/commercial/com-retail-fitout-shelving.jpg": "finished",
  "/curated/commercial/cx_y3.jpg": "finished",
};

export function resolvePhotoConstructionStage(src: string): SpecialtyConstructionStage {
  if (PHOTO_CONSTRUCTION_STAGE[src]) {
    return PHOTO_CONSTRUCTION_STAGE[src];
  }
  if (/[-/]1\.jpg$/i.test(src) || /tearoff|teardown|subfloor|antes|underlay|wrap|trench|rebar/i.test(src)) {
    return "preparation";
  }
  if (/[-/]2\.jpg$/i.test(src) || /install|repair|apron|driveway|scaffold|stud|slab/i.test(src)) {
    return "installation";
  }
  return "finished";
}

export function getPhotoConstructionStage(src: string): SpecialtyConstructionStage {
  return resolvePhotoConstructionStage(src);
}

export const VERIFIED_SPECIALTY_NIGHT_MAP: Record<string, string> = {
  "/curated/obra/single-family/sf-flooring-foyer-prep.jpg": "/curated/properties/sf-flooring-foyer-prep-night.jpg",
  "/curated/obra/single-family/sf-flooring-foyer-install.jpg": "/curated/properties/sf-flooring-foyer-install-night.jpg",
  "/curated/obra/single-family/sf-roofing-estate-prep.jpg": "/curated/properties/sf-roofing-estate-prep-night.jpg",
  "/curated/obra/single-family/sf-roofing-estate-install.jpg": "/curated/properties/sf-roofing-estate-install-night.jpg",
  "/curated/obra/single-family/sf-siding-seq1-prep.jpg": "/curated/properties/sf-siding-seq1-prep-night.jpg",
  "/curated/obra/single-family/sf-siding-seq1-install.jpg": "/curated/properties/sf-siding-seq1-install-night.jpg",
  "/curated/obra/single-family/sf-framing-seq1-prep.jpg": "/curated/properties/sf-framing-seq1-prep-night.jpg",
  "/curated/obra/single-family/sf-framing-seq1-install.jpg": "/curated/properties/sf-framing-seq1-install-night.jpg",
  "/curated/obra/single-family/sf-drywall-seq1-prep.jpg": "/curated/properties/sf-drywall-seq1-prep-night.jpg",
  "/curated/obra/single-family/sf-drywall-seq1-install.jpg": "/curated/properties/sf-drywall-seq1-install-night.jpg",
  "/curated/properties/sf-drywall-seq1-finish.jpg": "/curated/properties/sf-drywall-seq1-finish-night.jpg",
  "/curated/obra/single-family/sf-concrete-seq1-prep.jpg": "/curated/properties/sf-concrete-seq1-prep-night.jpg",
  "/curated/obra/single-family/sf-concrete-seq1-install.jpg": "/curated/properties/sf-concrete-seq1-install-night.jpg",
  "/curated/obra/single-family/sf-stone-seq1-prep.jpg": "/curated/properties/sf-stone-seq1-prep-night.jpg",
  "/curated/obra/single-family/sf-stone-seq1-install.jpg": "/curated/properties/sf-stone-seq1-install-night.jpg",
  "/curated/obra/single-family/sf-carpentry-seq1-prep.jpg": "/curated/properties/sf-carpentry-seq1-prep-night.jpg",
  "/curated/obra/single-family/sf-carpentry-seq1-install.jpg": "/curated/properties/sf-carpentry-seq1-install-night.jpg",
  "/curated/obra/multifamily/mf-roofing-seq1-prep.jpg": "/curated/properties/mf-roofing-seq1-prep-night.jpg",
  "/curated/obra/multifamily/mf-roofing-seq1-install.jpg": "/curated/properties/mf-roofing-seq1-install-night.jpg",
  "/curated/obra/multifamily/mf-siding-seq1-prep.jpg": "/curated/properties/mf-siding-seq1-prep-night.jpg",
  "/curated/obra/multifamily/mf-siding-seq1-install.jpg": "/curated/properties/mf-siding-seq1-install-night.jpg",
  "/curated/obra/multifamily/mf-framing-seq1-prep.jpg": "/curated/properties/mf-framing-seq1-prep-night.jpg",
  "/curated/obra/multifamily/mf-framing-seq1-install.jpg": "/curated/properties/mf-framing-seq1-install-night.jpg",
  "/curated/obra/multifamily/mf-drywall-seq1-prep.jpg": "/curated/properties/mf-drywall-seq1-prep-night.jpg",
  "/curated/obra/multifamily/mf-drywall-seq1-install.jpg": "/curated/properties/mf-drywall-seq1-install-night.jpg",
  "/curated/obra/multifamily/mf-flooring-seq1-prep.jpg": "/curated/properties/mf-flooring-seq1-prep-night.jpg",
  "/curated/obra/multifamily/mf-flooring-seq1-install.jpg": "/curated/properties/mf-flooring-seq1-install-night.jpg",
  "/curated/obra/multifamily/mf-concrete-seq1-prep.jpg": "/curated/properties/mf-concrete-seq1-prep-night.jpg",
  "/curated/obra/multifamily/mf-concrete-seq1-install.jpg": "/curated/properties/mf-concrete-seq1-install-night.jpg",
  "/curated/obra/multifamily/mf-stone-seq1-prep.jpg": "/curated/properties/mf-stone-seq1-prep-night.jpg",
  "/curated/obra/multifamily/mf-stone-seq1-install.jpg": "/curated/properties/mf-stone-seq1-install-night.jpg",
  "/curated/obra/multifamily/mf-carpentry-seq1-prep.jpg": "/curated/properties/mf-carpentry-seq1-prep-night.jpg",
  "/curated/obra/multifamily/mf-carpentry-seq1-install.jpg": "/curated/properties/mf-carpentry-seq1-install-night.jpg",
  "/curated/obra/townhomes/tw-roofing-seq1-prep.jpg": "/curated/properties/tw-roofing-seq1-prep-night.jpg",
  "/curated/obra/townhomes/tw-roofing-seq1-install.jpg": "/curated/properties/tw-roofing-seq1-install-night.jpg",
  "/curated/properties/tw-roofing-seq1-finish.jpg": "/curated/properties/tw-roofing-seq1-finish-night.jpg",
  "/curated/obra/townhomes/tw-siding-seq1-prep.jpg": "/curated/properties/tw-siding-seq1-prep-night.jpg",
  "/curated/obra/townhomes/tw-siding-seq1-install.jpg": "/curated/properties/tw-siding-seq1-install-night.jpg",
  "/curated/obra/townhomes/tw-framing-seq1-prep.jpg": "/curated/properties/tw-framing-seq1-prep-night.jpg",
  "/curated/obra/townhomes/tw-framing-seq1-install.jpg": "/curated/properties/tw-framing-seq1-install-night.jpg",
  "/curated/obra/townhomes/tw-drywall-seq1-prep.jpg": "/curated/properties/tw-drywall-seq1-prep-night.jpg",
  "/curated/obra/townhomes/tw-drywall-seq1-install.jpg": "/curated/properties/tw-drywall-seq1-install-night.jpg",
  "/curated/obra/townhomes/tw-flooring-seq1-prep.jpg": "/curated/properties/tw-flooring-seq1-prep-night.jpg",
  "/curated/obra/townhomes/tw-flooring-seq1-install.jpg": "/curated/properties/tw-flooring-seq1-install-night.jpg",
  "/curated/obra/townhomes/tw-concrete-seq1-prep.jpg": "/curated/properties/tw-concrete-seq1-prep-night.jpg",
  "/curated/obra/townhomes/tw-concrete-seq1-install.jpg": "/curated/properties/tw-concrete-seq1-install-night.jpg",
  "/curated/obra/townhomes/tw-stone-seq1-prep.jpg": "/curated/properties/tw-stone-seq1-prep-night.jpg",
  "/curated/obra/townhomes/tw-stone-seq1-install.jpg": "/curated/properties/tw-stone-seq1-install-night.jpg",
  "/curated/obra/townhomes/tw-carpentry-seq1-prep.jpg": "/curated/properties/tw-carpentry-seq1-prep-night.jpg",
  "/curated/obra/townhomes/tw-carpentry-seq1-install.jpg": "/curated/properties/tw-carpentry-seq1-install-night.jpg",
  "/curated/obra/commercial/com-roofing-seq1-prep.jpg": "/curated/properties/com-roofing-seq1-prep-night.jpg",
  "/curated/obra/commercial/com-roofing-seq1-install.jpg": "/curated/properties/com-roofing-seq1-install-night.jpg",
  "/curated/obra/commercial/com-siding-seq1-prep.jpg": "/curated/properties/com-siding-seq1-prep-night.jpg",
  "/curated/obra/commercial/com-siding-seq1-install.jpg": "/curated/properties/com-siding-seq1-install-night.jpg",
  "/curated/properties/com-siding-seq1-finish.jpg": "/curated/properties/com-siding-seq1-finish-night.jpg",
  "/curated/obra/commercial/com-framing-seq1-prep.jpg": "/curated/properties/com-framing-seq1-prep-night.jpg",
  "/curated/obra/commercial/com-framing-seq1-install.jpg": "/curated/properties/com-framing-seq1-install-night.jpg",
  "/curated/properties/com-framing-seq1-finish.jpg": "/curated/properties/com-framing-seq1-finish-night.jpg",
  "/curated/obra/commercial/com-drywall-seq1-prep.jpg": "/curated/properties/com-drywall-seq1-prep-night.jpg",
  "/curated/obra/commercial/com-drywall-seq1-install.jpg": "/curated/properties/com-drywall-seq1-install-night.jpg",
  "/curated/obra/commercial/com-flooring-seq1-prep.jpg": "/curated/properties/com-flooring-seq1-prep-night.jpg",
  "/curated/obra/commercial/com-flooring-seq1-install.jpg": "/curated/properties/com-flooring-seq1-install-night.jpg",
  "/curated/obra/commercial/com-concrete-seq1-prep.jpg": "/curated/properties/com-concrete-seq1-prep-night.jpg",
  "/curated/obra/commercial/com-concrete-seq1-install.jpg": "/curated/properties/com-concrete-seq1-install-night.jpg",
  "/curated/obra/commercial/com-stone-seq1-prep.jpg": "/curated/properties/com-stone-seq1-prep-night.jpg",
  "/curated/obra/commercial/com-stone-seq1-install.jpg": "/curated/properties/com-stone-seq1-install-night.jpg",
  "/curated/obra/commercial/com-carpentry-seq1-prep.jpg": "/curated/properties/com-carpentry-seq1-prep-night.jpg",
  "/curated/obra/commercial/com-carpentry-seq1-install.jpg": "/curated/properties/com-carpentry-seq1-install-night.jpg",
  "/curated/capabilities/com-boardroom.jpg": "/curated/properties/com-boardroom-night.jpg",
  "/curated/capabilities/com-retail-led.jpg": "/curated/properties/com-retail-led-night.jpg",
  "/curated/capabilities/com-walnut-lounge.jpg": "/curated/properties/com-walnut-lounge-night.jpg",
  "/curated/capabilities/fire-steel-ibeam.jpg": "/curated/properties/fire-steel-ibeam-night.jpg",
  "/curated/capabilities/fire-wood-framing.jpg": "/curated/properties/fire-wood-framing-night.jpg",
  "/curated/capabilities/mf-apartments-4story.jpg": "/curated/properties/mf-apartments-4story-night.jpg",
  "/curated/capabilities/mf-townhomes-row.jpg": "/curated/properties/mf-townhomes-row-night.jpg",
  "/curated/capabilities/mf-tpo-capex.jpg": "/curated/properties/mf-tpo-capex-night.jpg",
  "/curated/capabilities/mit-hardwood-underlay.jpg": "/curated/properties/mit-hardwood-underlay-night.jpg",
  "/curated/capabilities/mit-taped-drywall.jpg": "/curated/properties/mit-taped-drywall-night.jpg",
  "/curated/capabilities/reo-roof-3phase.jpg": "/curated/properties/reo-roof-3phase-night.jpg",
  "/curated/capabilities/reo-siding-wrap.jpg": "/curated/properties/reo-siding-wrap-night.jpg",
  "/curated/capabilities/res-basement-media.jpg": "/curated/properties/res-basement-media-night.jpg",
  "/curated/commercial/com-clinical-corridor.jpg": "/curated/properties/com-clinical-corridor-night.jpg",
  "/curated/commercial/com-epdm-parapet-roof.jpg": "/curated/properties/com-epdm-parapet-roof-night.jpg",
  "/curated/commercial/com-flex-logistics-facade.jpg": "/curated/properties/com-flex-logistics-facade-night.jpg",
  "/curated/commercial/com-flex-logistics-slab-interior.jpg": "/curated/properties/com-flex-logistics-slab-interior-night.jpg",
  "/curated/commercial/com-open-plan-office-fitout.jpg": "/curated/properties/com-open-plan-office-fitout-night.jpg",
  "/curated/commercial/com-parking-apron-ada-v2.jpg": "/curated/properties/com-parking-apron-ada-v2-night.jpg",
  "/curated/commercial/com-polished-concrete-corridor.jpg": "/curated/properties/com-polished-concrete-corridor-night.jpg",
  "/curated/commercial/com-tenant-space-stone-storefront.jpg": "/curated/properties/com-tenant-space-stone-storefront-night.jpg",
  "/curated/commercial/com_01_1.jpg": "/curated/properties/com_01_1-night.jpg",
  "/curated/commercial/com_02_2.jpg": "/curated/properties/com_02_2-night.jpg",
  "/curated/commercial/com_03_2.jpg": "/curated/properties/com_03_2-night.jpg",
  "/curated/commercial/com_04_2.jpg": "/curated/properties/com_04_2-night.jpg",
  "/curated/commercial/cx_f2.jpg": "/curated/properties/cx_f2-night.jpg",
  "/curated/commercial/cx_i1.jpg": "/curated/properties/cx_i1-night.jpg",
  "/curated/commercial/cx_i2.jpg": "/curated/properties/cx_i2-night.jpg",
  "/curated/commercial/cx_o3.jpg": "/curated/properties/cx_o3-night.jpg",
  "/curated/commercial/cx_x3.jpg": "/curated/properties/cx_x3-night.jpg",
  "/curated/hero/com-dusk-steel.jpg": "/curated/properties/com-dusk-steel-night.jpg",
  "/curated/hero/com-framing-atrium.jpg": "/curated/properties/com-framing-atrium-night.jpg",
  "/curated/hero/com-hq-sunset.jpg": "/curated/properties/com-hq-sunset-night.jpg",
  "/curated/hero/com-lobby-limestone.jpg": "/curated/properties/com-lobby-limestone-night.jpg",
  "/curated/hero/com-plaza-stone.jpg": "/curated/properties/com-plaza-stone-night.jpg",
  "/curated/hero/com-reception-walnut.jpg": "/curated/properties/com-reception-walnut-night.jpg",
  "/curated/hero/res-cedar-deck-home.jpg": "/curated/properties/res-cedar-deck-home-night.jpg",
  "/curated/hero/res-coffered-hearth.jpg": "/curated/properties/res-coffered-hearth-night.jpg",
  "/curated/hero/res-estate-roofing.jpg": "/curated/properties/res-estate-roofing-night.jpg",
  "/curated/hero/res-farmhouse-metal.jpg": "/curated/properties/res-farmhouse-metal-night.jpg",
  "/curated/hero/res-multitier-deck.jpg": "/curated/properties/res-multitier-deck-night.jpg",
  "/curated/hero/res-navy-kitchen.jpg": "/curated/properties/res-navy-kitchen-night.jpg",
  "/curated/pairs/div01_03_despues.jpg": "/curated/properties/div01_03_despues-night.jpg",
  "/curated/pairs/div02_02_despues.jpg": "/curated/properties/div02_02_despues-night.jpg",
  "/curated/pairs/div03_02_despues.jpg": "/curated/properties/div03_02_despues-night.jpg",
  "/curated/properties/duplex-01-brick-cedar-asymmetric.jpg": "/curated/properties/duplex-01-brick-cedar-asymmetric-night.jpg",
  "/curated/properties/duplex-02-limestone-stucco-asymmetric.jpg": "/curated/properties/duplex-02-limestone-stucco-asymmetric-night.jpg",
  "/curated/properties/duplex-03-columbus-lplan-brick.jpg": "/curated/properties/duplex-03-columbus-lplan-brick-night.jpg",
  "/curated/properties/duplex-04-evanston-corner-twoflat.jpg": "/curated/properties/duplex-04-evanston-corner-twoflat-night.jpg",
  "/curated/properties/duplex-05-minneapolis-buffbrick-dormer.jpg": "/curated/properties/duplex-05-minneapolis-buffbrick-dormer-night.jpg",
  "/curated/properties/duplex-06-austin-limestone-infill.jpg": "/curated/properties/duplex-06-austin-limestone-infill-night.jpg",
  "/curated/properties/interior-commercial-boardroom-atrium.jpg": "/curated/properties/interior-commercial-boardroom-atrium-night.jpg",
  "/curated/properties/interior-commercial-executive-lounge-terrace.jpg": "/curated/properties/interior-commercial-executive-lounge-terrace-night.jpg",
  "/curated/properties/interior-custom-foyer-oak-staircase.jpg": "/curated/properties/interior-custom-foyer-oak-staircase-night.jpg",
  "/curated/properties/interior-duplex-brick-kitchen.jpg": "/curated/properties/interior-duplex-brick-kitchen-night.jpg",
  "/curated/properties/interior-duplex-brick-living.jpg": "/curated/properties/interior-duplex-brick-living-night.jpg",
  "/curated/properties/interior-duplex-rear-patio-courtyard.jpg": "/curated/properties/interior-duplex-rear-patio-courtyard-night.jpg",
  "/curated/properties/interior-limestone-modern-kitchen.jpg": "/curated/properties/interior-limestone-modern-kitchen-night.jpg",
  "/curated/properties/interior-limestone-modern-living.jpg": "/curated/properties/interior-limestone-modern-living-night.jpg",
  "/curated/properties/interior-primary-spa-bath-walkin.jpg": "/curated/properties/interior-primary-spa-bath-walkin-night.jpg",
  "/curated/properties/interior-primary-suite-oak-bedroom.jpg": "/curated/properties/interior-primary-suite-oak-bedroom-night.jpg",
  "/curated/properties/interior-singlefamily-greatroom-stone.jpg": "/curated/properties/interior-singlefamily-greatroom-stone-night.jpg",
  "/curated/properties/interior-townhouse-living-bay.jpg": "/curated/properties/interior-townhouse-living-bay-night.jpg",
  "/curated/properties/interior-townhouse-parlor-kitchen.jpg": "/curated/properties/interior-townhouse-parlor-kitchen-night.jpg",
  "/curated/properties/interior-townhouse-rooftop-terrace.jpg": "/curated/properties/interior-townhouse-rooftop-terrace-night.jpg",
  "/curated/properties/mkt-com-concrete-stone.jpg": "/curated/properties/mkt-com-concrete-stone-night.jpg",
  "/curated/properties/mkt-com-concrete-tiltup.jpg": "/curated/properties/mkt-com-concrete-tiltup-night.jpg",
  "/curated/properties/mkt-com-drywall-ceilings.jpg": "/curated/properties/mkt-com-drywall-ceilings-night.jpg",
  "/curated/properties/mkt-com-roofing-greenroof.jpg": "/curated/properties/mkt-com-roofing-greenroof-night.jpg",
  "/curated/properties/mkt-com-roofing-tpo.jpg": "/curated/properties/mkt-com-roofing-tpo-night.jpg",
  "/curated/properties/mkt-com-stone-colonnade.jpg": "/curated/properties/mkt-com-stone-colonnade-night.jpg",
  "/curated/properties/mkt-com-stone-masonry.jpg": "/curated/properties/mkt-com-stone-masonry-night.jpg",
  "/curated/properties/mkt-mf-carpentry-lounge.jpg": "/curated/properties/mkt-mf-carpentry-lounge-night.jpg",
  "/curated/properties/mkt-mf-concrete-podium.jpg": "/curated/properties/mkt-mf-concrete-podium-night.jpg",
  "/curated/properties/mkt-mf-drywall.jpg": "/curated/properties/mkt-mf-drywall-night.jpg",
  "/curated/properties/mkt-mf-flooring-concrete.jpg": "/curated/properties/mkt-mf-flooring-concrete-night.jpg",
  "/curated/properties/mkt-mf-framing-trusses.jpg": "/curated/properties/mkt-mf-framing-trusses-night.jpg",
  "/curated/properties/mkt-mf-framing.jpg": "/curated/properties/mkt-mf-framing-night.jpg",
  "/curated/properties/mkt-mf-roofing.jpg": "/curated/properties/mkt-mf-roofing-night.jpg",
  "/curated/properties/mkt-mf-stone-courtyard.jpg": "/curated/properties/mkt-mf-stone-courtyard-night.jpg",
  "/curated/properties/mkt-mf-stone-entry.jpg": "/curated/properties/mkt-mf-stone-entry-night.jpg",
  "/curated/properties/mkt-sfh-concrete.jpg": "/curated/properties/mkt-sfh-concrete-night.jpg",
  "/curated/properties/mkt-sfh-drywall-flooring.jpg": "/curated/properties/mkt-sfh-drywall-flooring-night.jpg",
  "/curated/properties/mkt-sfh-framing.jpg": "/curated/properties/mkt-sfh-framing-night.jpg",
  "/curated/properties/mkt-sfh-stone-exterior.jpg": "/curated/properties/mkt-sfh-stone-exterior-night.jpg",
  "/curated/properties/mkt-twn-carpentry-library.jpg": "/curated/properties/mkt-twn-carpentry-library-night.jpg",
  "/curated/properties/mkt-twn-carpentry-pergola.jpg": "/curated/properties/mkt-twn-carpentry-pergola-night.jpg",
  "/curated/properties/mkt-twn-concrete-drive.jpg": "/curated/properties/mkt-twn-concrete-drive-night.jpg",
  "/curated/properties/mkt-twn-concrete-stone.jpg": "/curated/properties/mkt-twn-concrete-stone-night.jpg",
  "/curated/properties/mkt-twn-drywall-gallery.jpg": "/curated/properties/mkt-twn-drywall-gallery-night.jpg",
  "/curated/properties/mkt-twn-flooring-herringbone.jpg": "/curated/properties/mkt-twn-flooring-herringbone-night.jpg",
  "/curated/properties/mkt-twn-flooring-stairtreads.jpg": "/curated/properties/mkt-twn-flooring-stairtreads-night.jpg",
  "/curated/properties/mkt-twn-framing-drywall.jpg": "/curated/properties/mkt-twn-framing-drywall-night.jpg",
  "/curated/properties/mkt-twn-framing-partywall.jpg": "/curated/properties/mkt-twn-framing-partywall-night.jpg",
  "/curated/properties/mkt-twn-framing-rooftop.jpg": "/curated/properties/mkt-twn-framing-rooftop-night.jpg",
  "/curated/properties/mkt-twn-framing-row.jpg": "/curated/properties/mkt-twn-framing-row-night.jpg",
  "/curated/properties/mkt-twn-roofing-siding.jpg": "/curated/properties/mkt-twn-roofing-siding-night.jpg",
  "/curated/properties/mkt-twn-stone-brownstone.jpg": "/curated/properties/mkt-twn-stone-brownstone-night.jpg",
  "/curated/properties/mkt-twn-stone-gardenwall.jpg": "/curated/properties/mkt-twn-stone-gardenwall-night.jpg",
  "/curated/properties/mkt-twn-stone-hearth.jpg": "/curated/properties/mkt-twn-stone-hearth-night.jpg",
  "/curated/properties/townhouse-01-brick-limestone-row.jpg": "/curated/properties/townhouse-01-brick-limestone-row-night.jpg",
  "/curated/properties/townhouse-02-corner-masonry-cedar-row.jpg": "/curated/properties/townhouse-02-corner-masonry-cedar-row-night.jpg",
  "/curated/properties/townhouse-03-brownstone-mansard-row.jpg": "/curated/properties/townhouse-03-brownstone-mansard-row-night.jpg",
  "/curated/properties/townhouse-04-chicago-endunit-brick.jpg": "/curated/properties/townhouse-04-chicago-endunit-brick-night.jpg",
  "/curated/properties/townhouse-05-stepped-grade-rowhouses.jpg": "/curated/properties/townhouse-05-stepped-grade-rowhouses-night.jpg",
  "/curated/residential/div01_08_despues.jpg": "/curated/properties/div01_08_despues-night.jpg",
  "/curated/residential/r1.jpg": "/curated/properties/r1-night.jpg",
  "/curated/residential/s1.jpg": "/curated/properties/s1-night.jpg",
  "/curated/residential/sf-concrete-apron-curb-sidewalk.jpg": "/curated/properties/sf-concrete-apron-curb-sidewalk-night.jpg",
  "/curated/residential/sf-i-joist-osb-subfloor.jpg": "/curated/properties/sf-i-joist-osb-subfloor-night.jpg",
  "/curated/residential/sf-walkout-concrete-patio.jpg": "/curated/properties/sf-walkout-concrete-patio-night.jpg"
};

export const NIGHT_PAIR_REVIEW_QUEUE: ReadonlySet<string> = new Set([
  "/curated/capabilities/mf-apartments-4story.jpg",
  "/curated/capabilities/mf-tpo-capex.jpg",
  "/curated/capabilities/com-retail-led.jpg",
  "/curated/residential/r1.jpg",
  "/curated/properties/mkt-mf-framing-trusses.jpg",
  "/curated/capabilities/mit-hardwood-underlay.jpg",
  "/curated/properties/interior-duplex-rear-patio-courtyard.jpg",
  "/curated/commercial/com-tenant-space-stone-storefront.jpg",
  "/curated/properties/interior-commercial-executive-lounge-terrace.jpg",
  "/curated/hero/res-coffered-hearth.jpg"
]);

export type NightPairReviewStatus = "approved" | "review" | "unavailable";

export function resolveSpecialtyNightPair(daySrc: string): {
  hasNightVariant: boolean;
  nightSrc: string;
  nightReview: NightPairReviewStatus;
} {
  const mapped = VERIFIED_SPECIALTY_NIGHT_MAP[daySrc];
  if (!mapped) {
    return {
      hasNightVariant: false,
      nightSrc: daySrc,
      nightReview: "unavailable",
    };
  }
  if (NIGHT_PAIR_REVIEW_QUEUE.has(daySrc)) {
    return {
      hasNightVariant: false,
      nightSrc: daySrc,
      nightReview: "review",
    };
  }
  return {
    hasNightVariant: true,
    nightSrc: mapped,
    nightReview: "approved",
  };
}

export interface OrderedSpecialtyFrame {
  src: string;
  nightSrc: string;
  label: string;
  caption?: string;
  hasNightVariant: boolean;
  nightReview: NightPairReviewStatus;
  stage: SpecialtyConstructionStage;
  stageBadge: string;
  sequenceId?: string;
}

/**
 * Explicit sequence registry mapping photos that depict the exact same architectural space/building
 * across Stage 1 (Preparation) -> Stage 2 (Installation) -> Stage 3 (Finished).
 * Card preview selection prioritizes a complete 3-stage sequence sharing a `sequenceId`
 * before falling back to independent photos.
 */
export const PHOTO_SEQUENCE_ID: Record<string, string> = {
  // 1. Single-Family Roofing (Architectural Shingle & Copper Flashing Estate Roof sequence)
  "/curated/obra/single-family/sf-roofing-estate-prep.jpg": "sf-roofing-estate-seq1",
  "/curated/obra/single-family/sf-roofing-estate-install.jpg": "sf-roofing-estate-seq1",
  "/curated/hero/res-estate-roofing.jpg": "sf-roofing-estate-seq1",

  // 2. Single-Family Siding (Oblique Cedar-Deck Residence Lap & Cedar Siding sequence)
  "/curated/obra/single-family/sf-siding-seq1-prep.jpg": "sf-siding-craftsman-seq1",
  "/curated/obra/single-family/sf-siding-seq1-install.jpg": "sf-siding-craftsman-seq1",
  "/curated/hero/res-cedar-deck-home.jpg": "sf-siding-craftsman-seq1",

  // 3. Single-Family Framing (Open Structural Wood Shell sequence — scope ends at structural frame)
  "/curated/obra/single-family/sf-framing-seq1-prep.jpg": "sf-framing-timber-seq1",
  "/curated/obra/single-family/sf-framing-seq1-install.jpg": "sf-framing-timber-seq1",
  "/curated/properties/mkt-sfh-framing.jpg": "sf-framing-timber-seq1",

  // 4. Single-Family Drywall (Oblique Living Room Gypsum Sequence)
  "/curated/obra/single-family/sf-drywall-seq1-prep.jpg": "sf-drywall-hearth-seq1",
  "/curated/obra/single-family/sf-drywall-seq1-install.jpg": "sf-drywall-hearth-seq1",
  "/curated/properties/sf-drywall-seq1-finish.jpg": "sf-drywall-hearth-seq1",

  // 5. Single-Family Flooring (Custom White-Oak Foyer & Staircase sequence)
  "/curated/obra/single-family/sf-flooring-foyer-prep.jpg": "sf-flooring-foyer-oak-seq1",
  "/curated/obra/single-family/sf-flooring-foyer-install.jpg": "sf-flooring-foyer-oak-seq1",
  "/curated/properties/interior-custom-foyer-oak-staircase.jpg": "sf-flooring-foyer-oak-seq1",

  // 6. Single-Family Concrete (Oblique Rear Walkout Concrete Patio sequence)
  "/curated/obra/single-family/sf-concrete-seq1-prep.jpg": "sf-concrete-walkout-seq1",
  "/curated/obra/single-family/sf-concrete-seq1-install.jpg": "sf-concrete-walkout-seq1",
  "/curated/residential/sf-walkout-concrete-patio.jpg": "sf-concrete-walkout-seq1",

  // 7. Single-Family Stone & Masonry (Great Room Floor-to-Ceiling Natural Stone Hearth sequence)
  "/curated/obra/single-family/sf-stone-seq1-prep.jpg": "sf-stone-hearth-seq1",
  "/curated/obra/single-family/sf-stone-seq1-install.jpg": "sf-stone-hearth-seq1",
  "/curated/properties/interior-singlefamily-greatroom-stone.jpg": "sf-stone-hearth-seq1",

  // 8. Single-Family Carpentry (Walnut Butler's Pantry Cabinetry sequence)
  "/curated/obra/single-family/sf-carpentry-seq1-prep.jpg": "sf-carpentry-pantry-seq1",
  "/curated/obra/single-family/sf-carpentry-seq1-install.jpg": "sf-carpentry-pantry-seq1",
  "/curated/pairs/div03_02_despues.jpg": "sf-carpentry-pantry-seq1",

  // 9. Multifamily Roofing (Multi-Unit Gable Shingle & Standing-Seam Roof sequence)
  "/curated/obra/multifamily/mf-roofing-seq1-prep.jpg": "mf-roofing-seq1",
  "/curated/obra/multifamily/mf-roofing-seq1-install.jpg": "mf-roofing-seq1",
  "/curated/properties/mkt-mf-roofing.jpg": "mf-roofing-seq1",

  // 10. Multifamily Siding (Asymmetric Brick & Cedar Duplex Cladding sequence)
  "/curated/obra/multifamily/mf-siding-seq1-prep.jpg": "mf-siding-seq1",
  "/curated/obra/multifamily/mf-siding-seq1-install.jpg": "mf-siding-seq1",
  "/curated/properties/duplex-01-brick-cedar-asymmetric.jpg": "mf-siding-seq1",

  // 11. Multifamily Framing (4-Story Multi-Unit Structural Wood Shell sequence)
  "/curated/obra/multifamily/mf-framing-seq1-prep.jpg": "mf-framing-seq1",
  "/curated/obra/multifamily/mf-framing-seq1-install.jpg": "mf-framing-seq1",
  "/curated/commercial/cx_f2.jpg": "mf-framing-seq1",

  // 12. Multifamily Drywall (Multi-Unit Corridor & STC Demising Wall Drywall sequence)
  "/curated/obra/multifamily/mf-drywall-seq1-prep.jpg": "mf-drywall-seq1",
  "/curated/obra/multifamily/mf-drywall-seq1-install.jpg": "mf-drywall-seq1",
  "/curated/properties/mkt-mf-drywall.jpg": "mf-drywall-seq1",

  // 13. Multifamily Flooring (Duplex Brick-Accent Living Room Acoustic Flooring sequence)
  "/curated/obra/multifamily/mf-flooring-seq1-prep.jpg": "mf-flooring-seq1",
  "/curated/obra/multifamily/mf-flooring-seq1-install.jpg": "mf-flooring-seq1",
  "/curated/properties/interior-duplex-brick-living.jpg": "mf-flooring-seq1",

  // 14. Multifamily Concrete (Multifamily Concrete Podium & Parking Apron sequence)
  "/curated/obra/multifamily/mf-concrete-seq1-prep.jpg": "mf-concrete-seq1",
  "/curated/obra/multifamily/mf-concrete-seq1-install.jpg": "mf-concrete-seq1",
  "/curated/properties/mkt-mf-concrete-podium.jpg": "mf-concrete-seq1",

  // 15. Multifamily Stone & Masonry (Asymmetric Duplex Limestone & Stucco Masonry sequence)
  "/curated/obra/multifamily/mf-stone-seq1-prep.jpg": "mf-stone-seq1",
  "/curated/obra/multifamily/mf-stone-seq1-install.jpg": "mf-stone-seq1",
  "/curated/properties/duplex-02-limestone-stucco-asymmetric.jpg": "mf-stone-seq1",

  // 16. Multifamily Carpentry (Multi-Unit Lounge Custom Alcove Built-Ins sequence)
  "/curated/obra/multifamily/mf-carpentry-seq1-prep.jpg": "mf-carpentry-seq1",
  "/curated/obra/multifamily/mf-carpentry-seq1-install.jpg": "mf-carpentry-seq1",
  "/curated/properties/mkt-mf-carpentry-lounge.jpg": "mf-carpentry-seq1",

  // 17. Townhomes Roofing (Attached Brownstone Mansard & Dormer Roof sequence)
  "/curated/obra/townhomes/tw-roofing-seq1-prep.jpg": "tw-roofing-seq1",
  "/curated/obra/townhomes/tw-roofing-seq1-install.jpg": "tw-roofing-seq1",
  "/curated/properties/tw-roofing-seq1-finish.jpg": "tw-roofing-seq1",

  // 18. Townhomes Siding (Corner Masonry & Cedar Rainscreen Townhome sequence)
  "/curated/obra/townhomes/tw-siding-seq1-prep.jpg": "tw-siding-seq1",
  "/curated/obra/townhomes/tw-siding-seq1-install.jpg": "tw-siding-seq1",
  "/curated/properties/townhouse-02-corner-masonry-cedar-row.jpg": "tw-siding-seq1",

  // 19. Townhomes Framing (Rooftop Penthouse & Terrace Structural Wood Shell sequence)
  "/curated/obra/townhomes/tw-framing-seq1-prep.jpg": "tw-framing-seq1",
  "/curated/obra/townhomes/tw-framing-seq1-install.jpg": "tw-framing-seq1",
  "/curated/properties/mkt-twn-framing-rooftop.jpg": "tw-framing-seq1",

  // 20. Townhomes Drywall (3-Story Townhome Stairwell Gallery Drywall sequence)
  "/curated/obra/townhomes/tw-drywall-seq1-prep.jpg": "tw-drywall-seq1",
  "/curated/obra/townhomes/tw-drywall-seq1-install.jpg": "tw-drywall-seq1",
  "/curated/properties/mkt-twn-drywall-gallery.jpg": "tw-drywall-seq1",

  // 21. Townhomes Flooring (3-Story Townhome White-Oak Stair Treads & Hall sequence)
  "/curated/obra/townhomes/tw-flooring-seq1-prep.jpg": "tw-flooring-seq1",
  "/curated/obra/townhomes/tw-flooring-seq1-install.jpg": "tw-flooring-seq1",
  "/curated/properties/mkt-twn-flooring-stairtreads.jpg": "tw-flooring-seq1",

  // 22. Townhomes Concrete (Townhome Rear Alley Garage Apron & Paver Court sequence)
  "/curated/obra/townhomes/tw-concrete-seq1-prep.jpg": "tw-concrete-seq1",
  "/curated/obra/townhomes/tw-concrete-seq1-install.jpg": "tw-concrete-seq1",
  "/curated/properties/mkt-twn-concrete-drive.jpg": "tw-concrete-seq1",

  // 23. Townhomes Stone & Masonry (Attached Townhome Stepped Limestone Stoop & Garden Wall sequence)
  "/curated/obra/townhomes/tw-stone-seq1-prep.jpg": "tw-stone-seq1",
  "/curated/obra/townhomes/tw-stone-seq1-install.jpg": "tw-stone-seq1",
  "/curated/properties/mkt-twn-stone-gardenwall.jpg": "tw-stone-seq1",

  // 24. Townhomes Carpentry (Townhome Parlor Built-In Library & Custom Wainscoting sequence)
  "/curated/obra/townhomes/tw-carpentry-seq1-prep.jpg": "tw-carpentry-seq1",
  "/curated/obra/townhomes/tw-carpentry-seq1-install.jpg": "tw-carpentry-seq1",
  "/curated/properties/mkt-twn-carpentry-library.jpg": "tw-carpentry-seq1",

  // 25. Commercial Roofing (Commercial TPO Membrane & Parapet Roof sequence)
  "/curated/obra/commercial/com-roofing-seq1-prep.jpg": "com-roofing-seq1",
  "/curated/obra/commercial/com-roofing-seq1-install.jpg": "com-roofing-seq1",
  "/curated/properties/mkt-com-roofing-greenroof.jpg": "com-roofing-seq1",

  // 26. Commercial Siding / Exterior Envelope (Oblique Metal Panel & Storefront Envelope sequence)
  "/curated/obra/commercial/com-siding-seq1-prep.jpg": "com-siding-seq1",
  "/curated/obra/commercial/com-siding-seq1-install.jpg": "com-siding-seq1",
  "/curated/properties/com-siding-seq1-finish.jpg": "com-siding-seq1",

  // 27. Commercial Framing (Commercial Structural Steel & Cold-Formed Stud Shell sequence)
  "/curated/obra/commercial/com-framing-seq1-prep.jpg": "com-framing-seq1",
  "/curated/obra/commercial/com-framing-seq1-install.jpg": "com-framing-seq1",
  "/curated/properties/com-framing-seq1-finish.jpg": "com-framing-seq1",

  // 28. Commercial Drywall (Commercial Partition & Ceiling Drywall Assembly sequence)
  "/curated/obra/commercial/com-drywall-seq1-prep.jpg": "com-drywall-seq1",
  "/curated/obra/commercial/com-drywall-seq1-install.jpg": "com-drywall-seq1",
  "/curated/properties/mkt-com-drywall-ceilings.jpg": "com-drywall-seq1",

  // 29. Commercial Flooring (Large-Format Limestone Commercial Lobby Flooring sequence)
  "/curated/obra/commercial/com-flooring-seq1-prep.jpg": "com-flooring-seq1",
  "/curated/obra/commercial/com-flooring-seq1-install.jpg": "com-flooring-seq1",
  "/curated/hero/com-lobby-limestone.jpg": "com-flooring-seq1",

  // 30. Commercial Concrete (Commercial Plaza & Apron Concrete Slab sequence)
  "/curated/obra/commercial/com-concrete-seq1-prep.jpg": "com-concrete-seq1",
  "/curated/obra/commercial/com-concrete-seq1-install.jpg": "com-concrete-seq1",
  "/curated/properties/mkt-com-concrete-stone.jpg": "com-concrete-seq1",

  // 31. Commercial Stone & Masonry (Architectural Limestone Colonnade Masonry sequence)
  "/curated/obra/commercial/com-stone-seq1-prep.jpg": "com-stone-seq1",
  "/curated/obra/commercial/com-stone-seq1-install.jpg": "com-stone-seq1",
  "/curated/properties/mkt-com-stone-colonnade.jpg": "com-stone-seq1",

  // 32. Commercial Carpentry (Boardroom Atrium Custom Walnut Millwork sequence)
  "/curated/obra/commercial/com-carpentry-seq1-prep.jpg": "com-carpentry-seq1",
  "/curated/obra/commercial/com-carpentry-seq1-install.jpg": "com-carpentry-seq1",
  "/curated/properties/interior-commercial-boardroom-atrium.jpg": "com-carpentry-seq1",
};

export function buildOrderedSpecialtyFrames(
  triptych: { src: string; label: string; caption?: string }[],
  extraFrames?: { src: string; label: string; caption?: string }[]
): OrderedSpecialtyFrame[] {
  const seen = new Set<string>();
  const combined: (OrderedSpecialtyFrame & { originalIndex: number })[] = [];

  for (const item of [...triptych, ...(extraFrames ?? [])]) {
    if (seen.has(item.src)) continue;
    seen.add(item.src);
    const stage = resolvePhotoConstructionStage(item.src);
    const nightInfo = resolveSpecialtyNightPair(item.src);
    combined.push({
      src: item.src,
      nightSrc: nightInfo.nightSrc,
      label: item.label,
      caption: item.caption,
      hasNightVariant: nightInfo.hasNightVariant,
      nightReview: nightInfo.nightReview,
      stage,
      stageBadge: STAGE_BADGE_LABELS[stage],
      sequenceId: PHOTO_SEQUENCE_ID[item.src],
      originalIndex: combined.length,
    });
  }

  combined.sort((a, b) => {
    const stageDiff = CONSTRUCTION_STAGE_ORDER[a.stage] - CONSTRUCTION_STAGE_ORDER[b.stage];
    if (stageDiff !== 0) return stageDiff;
    return a.originalIndex - b.originalIndex;
  });

  return combined.map(({ originalIndex: _idx, ...rest }) => rest);
}

export function selectSpecialtyCardPreviews(
  orderedFrames: OrderedSpecialtyFrame[]
): OrderedSpecialtyFrame[] {
  if (orderedFrames.length <= 3) {
    return orderedFrames;
  }

  // 1. Prioritize a coherent 3-stage sequence (same sequenceId across preparation -> installation -> finished)
  const sequenceIds = Array.from(
    new Set(orderedFrames.map((f) => f.sequenceId).filter((id): id is string => Boolean(id)))
  );
  for (const seqId of sequenceIds) {
    const inSeq = orderedFrames.filter((f) => f.sequenceId === seqId);
    const seqPrep =
      inSeq.find((f) => f.stage === "preparation" && f.hasNightVariant) ??
      inSeq.find((f) => f.stage === "preparation");
    const seqInstall =
      inSeq.find((f) => f.stage === "installation" && f.hasNightVariant) ??
      inSeq.find((f) => f.stage === "installation");
    const seqFinished =
      inSeq.find((f) => f.stage === "finished" && f.hasNightVariant) ??
      inSeq.find((f) => f.stage === "finished");
    if (seqPrep && seqInstall && seqFinished) {
      return [seqPrep, seqInstall, seqFinished];
    }
  }

  // 2. Fallback: pick one frame per stage across the specialty gallery
  const pickForStage = (stage: SpecialtyConstructionStage) =>
    orderedFrames.find((f) => f.stage === stage && f.hasNightVariant) ??
    orderedFrames.find((f) => f.stage === stage);

  const prep = pickForStage("preparation");
  const install = pickForStage("installation");
  const finished = pickForStage("finished");

  if (prep && install && finished) {
    return [prep, install, finished];
  }

  const chosen: OrderedSpecialtyFrame[] = [];
  const used = new Set<string>();
  for (const candidate of [prep, install, finished]) {
    if (candidate && !used.has(candidate.src)) {
      chosen.push(candidate);
      used.add(candidate.src);
    }
  }
  for (const frame of orderedFrames) {
    if (chosen.length >= 3) break;
    if (!used.has(frame.src)) {
      chosen.push(frame);
      used.add(frame.src);
    }
  }
  return chosen.sort(
    (a, b) => CONSTRUCTION_STAGE_ORDER[a.stage] - CONSTRUCTION_STAGE_ORDER[b.stage]
  );
}
