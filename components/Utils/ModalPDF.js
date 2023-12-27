import ClickAwayListener from "react-click-away-listener"
import { Document, Text, Page, PDFViewer, View, StyleSheet, Svg } from "@react-pdf/renderer";

export const ModalPDF = ({ createPDF, setCreatePDF, Data }) => {
    const DateTime = new Date(parseInt(Data?.fecha)).toLocaleDateString("es-VE", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })
    const DataInvitado = Data?.invitados_array
    const styles = StyleSheet.create({
        page: {
            fontFamily: 'Helvetica',
            fontSize: 11,
            paddingTop: 30,
            paddingLeft: 10,
            paddingRight: 10,
            lineHeight: 1.5,
            flexDirection: 'column',
        },
        title: {
            display: "flex",
            justifyContent: "center",
            textAlign: "center",
            fontSize: 20
        },
        description: {

            marginTop: 12
        },
        descriptionRow: {
            display: "flex",
            flexDirection: "row",
            alignItems: "center"
        },
        descriptionItem: {
            fontSize: 15,
            marginRight: 3
        },
        descriptionSubItem: {
            fontSize: 12,
        },
        table: {
            display: "table",
            width: "100%",
            borderStyle: "solid",
            borderWidth: 1,
            borderRightWidth: 1,
            borderBottomWidth: 0,
            marginTop: 10
        },
        tableRow: {
            margin: "auto",
            flexDirection: "row",
            borderStyle: "solid",
            borderWidth: 1,
            borderBottomWidth: 1,
            borderLeftWidth: 0,
            borderRightWidth: 0,
            borderTopWidth: 0,

        },
        tableColH: {
            width: "16.65%",
            backgroundColor: "#C2C3C6"
        },
        tableCol: {
            width: "16.65%",
        },
        tableCell: {
            margin: "auto",
            marginTop: 5,
            fontSize: 10
        }
    });

    return (
        <>
            <div className=" backdrop-filter* *backdrop-blur z-30 fixed top-0 left-0 w-screen h-screen overflow-hidden " />
            <div className=" bg-black* opacity-60 z-30 fixed top-0 left-0 w-screen h-screen overflow-hidden " />
            <ClickAwayListener onClickAway={() => createPDF && setCreatePDF(false)}>
                <div className="bg-white pb-5 w-[90%] h-[95%] shadow-lg fixed m-auto inset-x-0 inset-y-0 z-50 rounded-xl ">
                    <PDFViewer style={{ width: "100%", height: "100%" }} >
                        <Document file="TusInvitados.pdf">
                            <Page style={styles.page}>
                                <View style={styles.title}>
                                    <Text>
                                        Lista de invitados
                                    </Text>
                                </View>
                                <View style={styles.description}>
                                    <View style={styles.descriptionRow}>
                                        <Text style={styles.descriptionItem}>
                                            Evento:
                                        </Text>
                                        <Text style={styles.descriptionSubItem}>
                                            {Data.nombre}
                                        </Text>
                                    </View>
                                    <View style={styles.descriptionRow}>
                                        <Text style={styles.descriptionItem}>
                                            Tipo:
                                        </Text>
                                        <Text style={styles.descriptionSubItem}>
                                            {Data.tipo}
                                        </Text>
                                    </View>
                                    <View style={styles.descriptionRow}>
                                        <Text style={styles.descriptionItem}>
                                            Fecha:
                                        </Text>
                                        <Text style={styles.descriptionSubItem}>
                                            {DateTime}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.table}>
                                    <View style={styles.tableRow}>
                                        <View style={styles.tableColH}>
                                            <Text style={styles.tableCell}>Nombre</Text>
                                        </View>
                                        <View style={styles.tableColH}>
                                            <Text style={styles.tableCell}>Asistencia</Text>
                                        </View>
                                        <View style={styles.tableColH}>
                                            <Text style={styles.tableCell}>Edad</Text>
                                        </View>
                                        <View style={styles.tableColH}>
                                            <Text style={styles.tableCell}>Menu</Text>
                                        </View>
                                        <View style={styles.tableColH}>
                                            <Text style={styles.tableCell}>Mesa</Text>
                                        </View>
                                        <View style={styles.tableColH}>
                                            <Text style={styles.tableCell}>Puesto</Text>
                                        </View>
                                    </View>
                                    {
                                        DataInvitado?.map((item, idx) => {
                                            return (
                                                <>
                                                    <View key={idx} style={styles.tableRow} >
                                                        <View style={styles.tableCol}>
                                                            <Text style={styles.tableCell}>
                                                                {item.nombre}
                                                            </Text>
                                                        </View>
                                                        <View style={styles.tableCol}>
                                                            <Text style={styles.tableCell}>
                                                                {item.asistencia}
                                                            </Text>
                                                        </View>

                                                        <View style={styles.tableCol}>
                                                            <Text style={styles.tableCell}>
                                                                {item.grupo_edad}
                                                            </Text>
                                                        </View>
                                                        <View style={styles.tableCol}>
                                                            <Text style={styles.tableCell}>
                                                                {item.nombre_menu}
                                                            </Text>
                                                        </View>
                                                        <View style={styles.tableCol}>
                                                            <Text style={styles.tableCell}>
                                                                {item.nombre_mesa}
                                                            </Text>
                                                        </View>
                                                        <View style={styles.tableCol}>
                                                            <Text style={styles.tableCell}>
                                                                {item.puesto}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                </>
                                            )
                                        })
                                    }
                                </View>
                            </Page>
                        </Document>
                    </PDFViewer>
                </div>
            </ClickAwayListener>
        </>
    )
}
