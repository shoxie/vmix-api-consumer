import {
    DialogBody,
    DialogCloseTrigger,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogRoot,
    DialogTitle,
    DialogTrigger,
    DialogBackdrop,
} from "@/components/ui/dialog"
import { MatchData } from "@/types/Matches";
import { Box, Button, Grid, GridItem, Heading, HStack, Input, Switch, VStack } from "@chakra-ui/react";
import _ from "lodash";
import { useEffect, useState } from "react";
import AutoCompleteUI from "./AutoComplete";
import {
    SelectContent,
    SelectItem,
    SelectLabel,
    SelectRoot,
    SelectTrigger,
    SelectValueText,
} from "@/components/ui/select"
import { createListCollection } from "@chakra-ui/react"
import { setConfig } from "next/config";

const actions = createListCollection({
    items: [
        { label: "SetText", value: "SetText" },
        { label: "AddInput", value: "AddInput" },
        { label: "RemoveInput", value: "RemoveInput" },
        { label: "ActiveInput", value: "ActiveInput" },
    ],
})

const SwitchUI = ({ isChecked, onChange, label }: { isChecked: boolean, onChange: (isChecked: boolean) => void, label: string }) => {
    return (
        <Switch.Root onCheckedChange={(e) => onChange(e.checked)} checked={isChecked}>
            <Switch.HiddenInput />
            <Switch.Control>
                <Switch.Thumb />
            </Switch.Control>
            <Switch.Label>{label}</Switch.Label>
        </Switch.Root>
    )
}

const StepOne = (
    { keys,
        selectedKey,
        includeMatchId,
        includeAuthKey,
        onKeySelect,
        setIncludeMatchId,
        setIncludeAuthKey
    }: {
        keys: string[],
        selectedKey: string[],
        includeMatchId: boolean,
        includeAuthKey: boolean,
        onKeySelect: (key: string) => void,
        setIncludeMatchId: (isChecked: boolean) => void,
        setIncludeAuthKey: (isChecked: boolean) => void
    }) => {
    return (
        <Box>
            <Grid templateColumns="repeat(4, 1fr)" gap={5} pt={5}>
                {keys.map((key) => (
                    <GridItem colSpan={1} key={key} onClick={() => onKeySelect(key)} cursor={"pointer"}>
                        <Box bg={selectedKey.includes(key) ? "blue.500" : "transparent"} p={2} borderRadius={5}>
                            {key}
                        </Box>
                    </GridItem>
                ))}
            </Grid>
            <HStack>
                <SwitchUI key={"includeMatchId"} isChecked={includeMatchId} label="Include match ID ?" onChange={(isChecked) => setIncludeMatchId(isChecked)} />
                <SwitchUI key={"includeAuthKey"} isChecked={includeAuthKey} label="Include auth key ?" onChange={(isChecked) => setIncludeAuthKey(isChecked)} />
            </HStack>
        </Box>
    )
}

const StepTwo = ({ selectedKeys, onVMixFunctionSelect }: { selectedKeys: string[], onVMixFunctionSelect: (conf: any, Value: string) => void }) => {
    const [keyName, setKeyName] = useState<string>("");
    const [guid, setGuid] = useState<string>("");

    function setConfig(action: string, key: string) {
        onVMixFunctionSelect({
            Function: action[0],
            SelectedName: keyName,
            Input: guid,
        }, key);
    }
    return (
        <Box>
            <Grid templateColumns="repeat(3, 1fr)" gap={5} pt={5}>
                {selectedKeys.map((key) => (
                    <GridItem colSpan={1} key={key} cursor={"pointer"} border={"1px solid"}>
                        <VStack p={2} borderRadius={5}>
                            <Box>{key}</Box>
                            <Input placeholder="vMix key name" border={"1px solid"} pl={1} value={keyName} onChange={(e) => setKeyName(e.target.value)} />
                            <Input placeholder="vMix GUID" border={"1px solid"} pl={1} value={guid} onChange={(e) => setGuid(e.target.value)} />
                            <VMixFunctions onVMixFunctionSelect={(k) => setConfig(k, key)} />
                        </VStack>
                    </GridItem>
                ))}
            </Grid>
        </Box>
    )
}

const VMixFunctions = ({ onVMixFunctionSelect }: { onVMixFunctionSelect: (conf: any) => void }) => {
    return (
        <SelectRoot collection={actions} size="sm" multiple={false} onValueChange={(value) => onVMixFunctionSelect(value.value)}>
            {/* <SelectLabel>Select vMix function</SelectLabel> */}
            <SelectTrigger>
                <SelectValueText placeholder="Select vMix function" />
            </SelectTrigger>
            <SelectContent zIndex={9999}>
                {actions.items.map((action) => (
                    <SelectItem item={action} key={action.value}>
                        {action.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </SelectRoot>
    );
}


const ConfigModal = ({ matchData }: { matchData: MatchData }) => {
    const [keys, setKeys] = useState<string[]>([]);
    const [selectedKey, setSelectedKey] = useState<string[]>([]);
    const [includeMatchId, setIncludeMatchId] = useState<boolean>(true);
    const [includeAuthKey, setIncludeAuthKey] = useState<boolean>(true);
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [config, setConfig] = useState<any>([]);

    useEffect(() => {
        // Get all keys from the match data, which is a nested object
        const keys = getAllKeysLodash(matchData);
        setKeys(keys);
        console.log('keys', keys)
    }, [matchData]);

    function getAllKeysLodash(obj: any, keys: Set<string> = new Set()): string[] {
        if (!_.isObject(obj)) {
            return Array.from(keys);
        }

        _.forOwn(obj, (value: any, key: string) => {
            keys.add(key);
            if (_.isPlainObject(value)) {
                getAllKeysLodash(value, keys);
            } else if (_.isArray(value) && value.some(_.isPlainObject)) {
                value.forEach((item: any) => {
                    if (_.isPlainObject(item)) {
                        getAllKeysLodash(item, keys);
                    }
                });
            }
        });

        return Array.from(keys);
    }

    

    function onKeySelect(key: string) {
        if (selectedKey.includes(key)) {
            setSelectedKey(selectedKey.filter((k) => k !== key));
        }
        else {
            setSelectedKey([...selectedKey, key]);
        }
    }

    function findKeyPathLodash(obj: any, key: string): string[] | null {
        function recursiveSearch(currentObj: any, currentPath: string[]): string[] | null {
          if (_.has(currentObj, key)) {
            return [...currentPath, key];
          }
      
          for (const k in currentObj as any) {
            if (_.has(currentObj, k)) {
              const value = currentObj[k];
              if (_.isPlainObject(value)) {
                const result = recursiveSearch(value, [...currentPath, k]);
                if (result) {
                  return result;
                }
              } else if (_.isArray(value) && value?.some(_.isPlainObject)) {
                for (let i = 0; i < value.length; i++) {
                  if (_.isPlainObject(value[i])) {
                    const result = recursiveSearch(value[i], [...currentPath, k, i.toString()]);
                    if (result) {
                      return result;
                    }
                  }
                }
              }
            }
          }
          return null;
        }
      
        return recursiveSearch(obj, []);
      }

    function onVMixFunctionSelect(conf: any, key: string) {
        setConfig([...config, { ...conf, Value: findKeyPathLodash(matchData, key)?.join('.') }]);
        console.log('config', config)
    }

    return (
        <DialogRoot size={"xl"}>
            <DialogBackdrop />
            <DialogTrigger>
                <Button colorPalette={"blue"}>
                    Config
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogCloseTrigger />
                <DialogHeader>
                    <DialogTitle>
                        <Heading size={"lg"}>
                            Config
                        </Heading>
                    </DialogTitle>
                </DialogHeader>
                <DialogBody w={"100%"}>
                    <Box w={"100%"}>
                        <AutoCompleteUI data={keys} />
                    </Box>
                    {currentStep === 0 && (
                        <StepOne keys={keys} selectedKey={selectedKey} includeMatchId={includeMatchId} includeAuthKey={includeAuthKey} onKeySelect={onKeySelect} setIncludeMatchId={setIncludeMatchId} setIncludeAuthKey={setIncludeAuthKey} />
                    )}
                    {currentStep === 1 && (
                        <StepTwo selectedKeys={selectedKey} onVMixFunctionSelect={onVMixFunctionSelect} />
                    )}
                </DialogBody>
                <DialogFooter>
                    <HStack justify={"end"}>
                        {
                            currentStep === 0 && (
                                <Button colorPalette={"blue"} onClick={() => setCurrentStep(1)}>
                                    Next
                                </Button>
                            )
                        }
                        {
                            currentStep === 1 && (
                                <Button colorPalette={"blue"} onClick={() => setCurrentStep(0)}>
                                    Back
                                </Button>
                            )
                        }
                        <Button colorPalette={"green"} onClick={() => console.log('Save')}>
                            Save
                        </Button>
                    </HStack>
                </DialogFooter>
            </DialogContent>
        </DialogRoot>
    )
}
export default ConfigModal;