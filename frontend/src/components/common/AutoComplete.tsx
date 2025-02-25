import { Flex, Field } from "@chakra-ui/react";
import {
    AutoComplete,
    AutoCompleteInput,
    AutoCompleteItem,
    AutoCompleteList,
} from "@choc-ui/chakra-autocomplete";

const AutoCompleteUI = ({ data }: { data: string[] }) => {

    return (
        <Flex justify="center" align="center" minW="full">
            <Field.Root w="full">
                <AutoComplete openOnFocus>
                    <AutoCompleteInput variant="subtle" />
                    <AutoCompleteList>
                        {data.map((item, cid) => (
                            <AutoCompleteItem
                                key={`option-${cid}`}
                                value={item}
                            >
                                {item}
                            </AutoCompleteItem>
                        ))}
                    </AutoCompleteList>
                </AutoComplete>
                <Field.HelperText>
                    Start typing to search for a field
                </Field.HelperText>
            </Field.Root>
        </Flex>
    );
}

export default AutoCompleteUI;