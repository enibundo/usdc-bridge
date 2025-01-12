import { SigningStargateClient } from "@cosmjs/stargate";
import { useMutation } from "@tanstack/react-query";

export const useUsdcBridge = ({
  signingClient,
}: {
  signingClient: SigningStargateClient | undefined;
}) =>
  useMutation({
    mutationKey: [signingClient],
    mutationFn: async ({
      address,
      amount,
      recipient,
    }: {
      address: string;
      amount: number;
      recipient: string;
    }) => {
      const rawMintRecipient = recipient;
      const cleanedMintRecipient = rawMintRecipient.replace(/^0x/, "");
      const zeroesNeeded = 64 - cleanedMintRecipient.length;
      const mintRecipient = "0".repeat(zeroesNeeded) + cleanedMintRecipient;
      const buffer = Buffer.from(mintRecipient, "hex");
      const mintRecipientBytes = new Uint8Array(buffer);
      const uusdcAmount = (Number(amount) * 10) ^ 6;

      const msg = {
        typeUrl: "/circle.cctp.v1.MsgDepositForBurn",
        value: {
          from: address,
          amount: uusdcAmount.toString(),
          destinationDomain: 0,
          mintRecipient: mintRecipientBytes,
          burnToken: "uusdc",
        },
      };

      const fee = {
        amount: [
          {
            denom: "uusdc",
            amount: "0",
          },
        ],
        gas: "200000",
      };

      const memo = "";

      try {
        const result = await signingClient?.signAndBroadcast(
          address,
          [msg],
          fee,
          memo
        );
      } catch (e) {
        console.log(e);
      }
    },
  });
