import { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { Reclaim, ReclaimInterface } from "../Reclaim";
export declare class Reclaim__factory {
    static readonly abi: readonly [{
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: false;
            readonly internalType: "address";
            readonly name: "previousAdmin";
            readonly type: "address";
        }, {
            readonly indexed: false;
            readonly internalType: "address";
            readonly name: "newAdmin";
            readonly type: "address";
        }];
        readonly name: "AdminChanged";
        readonly type: "event";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "beacon";
            readonly type: "address";
        }];
        readonly name: "BeaconUpgraded";
        readonly type: "event";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly components: readonly [{
                readonly internalType: "uint32";
                readonly name: "id";
                readonly type: "uint32";
            }, {
                readonly internalType: "uint32";
                readonly name: "timestampStart";
                readonly type: "uint32";
            }, {
                readonly internalType: "uint32";
                readonly name: "timestampEnd";
                readonly type: "uint32";
            }, {
                readonly components: readonly [{
                    readonly internalType: "address";
                    readonly name: "addr";
                    readonly type: "address";
                }, {
                    readonly internalType: "string";
                    readonly name: "host";
                    readonly type: "string";
                }];
                readonly internalType: "struct Reclaim.Witness[]";
                readonly name: "witnesses";
                readonly type: "tuple[]";
            }, {
                readonly internalType: "uint8";
                readonly name: "minimumWitnessesForClaimCreation";
                readonly type: "uint8";
            }];
            readonly indexed: false;
            readonly internalType: "struct Reclaim.Epoch";
            readonly name: "epoch";
            readonly type: "tuple";
        }];
        readonly name: "EpochAdded";
        readonly type: "event";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: false;
            readonly internalType: "uint8";
            readonly name: "version";
            readonly type: "uint8";
        }];
        readonly name: "Initialized";
        readonly type: "event";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "previousOwner";
            readonly type: "address";
        }, {
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "newOwner";
            readonly type: "address";
        }];
        readonly name: "OwnershipTransferred";
        readonly type: "event";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "implementation";
            readonly type: "address";
        }];
        readonly name: "Upgraded";
        readonly type: "event";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "witnessAddress";
            readonly type: "address";
        }, {
            readonly internalType: "string";
            readonly name: "host";
            readonly type: "string";
        }];
        readonly name: "addAsWitness";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "addNewEpoch";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint32";
            readonly name: "epochNum";
            readonly type: "uint32";
        }, {
            readonly components: readonly [{
                readonly internalType: "string";
                readonly name: "provider";
                readonly type: "string";
            }, {
                readonly internalType: "string";
                readonly name: "parameters";
                readonly type: "string";
            }, {
                readonly internalType: "string";
                readonly name: "context";
                readonly type: "string";
            }];
            readonly internalType: "struct Claims.ClaimInfo";
            readonly name: "claimInfo";
            readonly type: "tuple";
        }, {
            readonly components: readonly [{
                readonly internalType: "bytes32";
                readonly name: "identifier";
                readonly type: "bytes32";
            }, {
                readonly internalType: "address";
                readonly name: "owner";
                readonly type: "address";
            }, {
                readonly internalType: "uint32";
                readonly name: "timestampS";
                readonly type: "uint32";
            }, {
                readonly internalType: "uint256";
                readonly name: "epoch";
                readonly type: "uint256";
            }];
            readonly internalType: "struct Claims.CompleteClaimData";
            readonly name: "claimData";
            readonly type: "tuple";
        }, {
            readonly internalType: "bytes[]";
            readonly name: "signatures";
            readonly type: "bytes[]";
        }];
        readonly name: "assertValidEpochAndSignedClaim";
        readonly outputs: readonly [];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "currentEpoch";
        readonly outputs: readonly [{
            readonly internalType: "uint32";
            readonly name: "";
            readonly type: "uint32";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "epochDurationS";
        readonly outputs: readonly [{
            readonly internalType: "uint32";
            readonly name: "";
            readonly type: "uint32";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly name: "epochs";
        readonly outputs: readonly [{
            readonly internalType: "uint32";
            readonly name: "id";
            readonly type: "uint32";
        }, {
            readonly internalType: "uint32";
            readonly name: "timestampStart";
            readonly type: "uint32";
        }, {
            readonly internalType: "uint32";
            readonly name: "timestampEnd";
            readonly type: "uint32";
        }, {
            readonly internalType: "uint8";
            readonly name: "minimumWitnessesForClaimCreation";
            readonly type: "uint8";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint32";
            readonly name: "epoch";
            readonly type: "uint32";
        }];
        readonly name: "fetchEpoch";
        readonly outputs: readonly [{
            readonly components: readonly [{
                readonly internalType: "uint32";
                readonly name: "id";
                readonly type: "uint32";
            }, {
                readonly internalType: "uint32";
                readonly name: "timestampStart";
                readonly type: "uint32";
            }, {
                readonly internalType: "uint32";
                readonly name: "timestampEnd";
                readonly type: "uint32";
            }, {
                readonly components: readonly [{
                    readonly internalType: "address";
                    readonly name: "addr";
                    readonly type: "address";
                }, {
                    readonly internalType: "string";
                    readonly name: "host";
                    readonly type: "string";
                }];
                readonly internalType: "struct Reclaim.Witness[]";
                readonly name: "witnesses";
                readonly type: "tuple[]";
            }, {
                readonly internalType: "uint8";
                readonly name: "minimumWitnessesForClaimCreation";
                readonly type: "uint8";
            }];
            readonly internalType: "struct Reclaim.Epoch";
            readonly name: "";
            readonly type: "tuple";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint32";
            readonly name: "epoch";
            readonly type: "uint32";
        }, {
            readonly internalType: "bytes32";
            readonly name: "identifier";
            readonly type: "bytes32";
        }, {
            readonly internalType: "uint32";
            readonly name: "timestampS";
            readonly type: "uint32";
        }];
        readonly name: "fetchWitnessesForClaim";
        readonly outputs: readonly [{
            readonly components: readonly [{
                readonly internalType: "address";
                readonly name: "addr";
                readonly type: "address";
            }, {
                readonly internalType: "string";
                readonly name: "host";
                readonly type: "string";
            }];
            readonly internalType: "struct Reclaim.Witness[]";
            readonly name: "";
            readonly type: "tuple[]";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "initialize";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "minimumWitnessesForClaimCreation";
        readonly outputs: readonly [{
            readonly internalType: "uint8";
            readonly name: "";
            readonly type: "uint8";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "owner";
        readonly outputs: readonly [{
            readonly internalType: "address";
            readonly name: "";
            readonly type: "address";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "proxiableUUID";
        readonly outputs: readonly [{
            readonly internalType: "bytes32";
            readonly name: "";
            readonly type: "bytes32";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "witnessAddress";
            readonly type: "address";
        }];
        readonly name: "removeAsWitness";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "renounceOwnership";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "newOwner";
            readonly type: "address";
        }];
        readonly name: "transferOwnership";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "addr";
            readonly type: "address";
        }, {
            readonly internalType: "bool";
            readonly name: "isWhitelisted";
            readonly type: "bool";
        }];
        readonly name: "updateWitnessWhitelist";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "newImplementation";
            readonly type: "address";
        }];
        readonly name: "upgradeTo";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "newImplementation";
            readonly type: "address";
        }, {
            readonly internalType: "bytes";
            readonly name: "data";
            readonly type: "bytes";
        }];
        readonly name: "upgradeToAndCall";
        readonly outputs: readonly [];
        readonly stateMutability: "payable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly name: "witnesses";
        readonly outputs: readonly [{
            readonly internalType: "address";
            readonly name: "addr";
            readonly type: "address";
        }, {
            readonly internalType: "string";
            readonly name: "host";
            readonly type: "string";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }];
    static createInterface(): ReclaimInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): Reclaim;
}
