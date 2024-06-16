import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import React from "react";

export const CodeVariant = ({ name, children }) => {
    return (
        <div>
            {children}
        </div>
    )
}

export const CodeVariants = ({ tabs, children }) => {
    tabs = tabs === undefined ? true : tabs
    children = Array.isArray(children) ? children : [children]

    if (tabs) {
        return (
            <Tabs defaultValue={children[0].props.name} className={`code-variants bg-gray-50 rounded-lg`}>
                <TabsList>
                    {children.map(({props}) => (
                        <TabsTrigger key={props.name} value={props.name}>{props.name}</TabsTrigger>
                    ))}
                </TabsList>
                {children.map(variant => (
                    <TabsContent key={variant.props.name} value={variant.props.name} paddingY={2} paddingX={6}>
                        {variant}
                    </TabsContent>
                ))}
            </Tabs>
        )
    }

    return (
        <div className={`code-variants w-full flex pt-2 relative max-w-full justify-center`}>
            {children.map((variant, idx) => (
                <div key={idx} className={`code-variant flex flex-col px-1 first:pl-0 last:pr-0 max-w-full flex-1`}>
                    <p className={'text-center whitespace-pre'}>
                        {variant.props.name}
                    </p>
                    {variant}
                </div>
            ))}
        </div>
    )
}