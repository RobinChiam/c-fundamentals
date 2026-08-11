interface ConceptualModelNoticeProps {
  showSimulatedAddresses?: boolean;
}

export function ConceptualModelNotice({
  showSimulatedAddresses = false,
}: ConceptualModelNoticeProps) {
  return (
    <>
      <p>
        This is a conceptual teaching model. Addresses and memory/frame layouts are
        simulated. It does not show the actual memory layout of your running program.
      </p>
      {showSimulatedAddresses ? (
        <p className="mt-2">
          Simulated addresses (for example, 0x1000) are deterministic teaching labels,
          not real process addresses.
        </p>
      ) : null}
    </>
  );
}
